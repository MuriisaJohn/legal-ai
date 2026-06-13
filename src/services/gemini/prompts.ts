export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

export interface PromptTemplate {
  system: string;
  user: string;
}

export function renderPrompt(template: PromptTemplate, vars: Record<string, string>): { system: string; user: string } {
  return {
    system: renderTemplate(template.system, vars),
    user: renderTemplate(template.user, vars),
  };
}
