export class HttpError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body?: string
  ) {
    super(`HTTP ${status}: ${statusText}`);
    this.name = 'HttpError';
  }
}

export interface HttpClientConfig {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  retries?: number;
  timeout?: number;
}

export class HttpClient {
  constructor(private config: HttpClientConfig) {}

  async post<TReq extends Record<string, unknown>, TRes>(
    path: string,
    body: TReq,
    headers?: Record<string, string>,
    signal?: AbortSignal
  ): Promise<TRes> {
    return this.request<TRes>('POST', path, body, headers, signal);
  }

  async get<TRes>(
    path: string,
    headers?: Record<string, string>,
    signal?: AbortSignal
  ): Promise<TRes> {
    return this.request<TRes>('GET', path, undefined, headers, signal);
  }

  private async request<TRes>(
    method: string,
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
    signal?: AbortSignal
  ): Promise<TRes> {
    const url = `${this.config.baseUrl}${path}`;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= (this.config.retries ?? 0); attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(
          () => controller.abort(),
          signal ? undefined : this.config.timeout ?? 30000
        );

        const combinedSignal = signal
          ? this.combineSignals(signal, controller.signal)
          : controller.signal;

        const response = await fetch(url, {
          method,
          headers: { ...this.config.defaultHeaders, ...headers },
          body: body ? JSON.stringify(body) : undefined,
          signal: combinedSignal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
          const text = await response.text().catch(() => '');
          throw new HttpError(response.status, response.statusText, text);
        }

        const contentType = response.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
          return (await response.json()) as TRes;
        }
        return (await response.text()) as unknown as TRes;
      } catch (err) {
        if (err instanceof HttpError) {
          if (err.status !== 429 && (err.status < 500 || err.status >= 600)) {
            throw err;
          }
          lastError = err;
          if (attempt < (this.config.retries ?? 0)) {
            let delay = 1000 * Math.pow(2, attempt);
            if (err.status === 429 && err.body) {
              try {
                const parsed = JSON.parse(err.body);
                const retryInfo = parsed.error?.details?.find(
                  (d: Record<string, unknown>) =>
                    String(d['@type']).includes('RetryInfo')
                );
                if (retryInfo?.retryDelay) {
                  const seconds = parseFloat(String(retryInfo.retryDelay).replace('s', ''));
                  if (seconds > 0) delay = seconds * 1000 + 500;
                }
              } catch {}
            }
            await new Promise(r => setTimeout(r, delay));
          }
        } else if (err instanceof DOMException && err.name === 'AbortError') {
          throw err;
        } else {
          lastError = err instanceof Error ? err : new Error(String(err));
          if (attempt < (this.config.retries ?? 0)) {
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
          }
        }
      }
    }
    throw lastError ?? new Error('Request failed');
  }

  private combineSignals(...signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();
    for (const signal of signals) {
      if (signal.aborted) {
        controller.abort(signal.reason);
        return controller.signal;
      }
      signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
    }
    return controller.signal;
  }
}
