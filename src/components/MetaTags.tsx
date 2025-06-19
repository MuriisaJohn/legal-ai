import { Helmet } from 'react-helmet';

interface MetaTagsProps {
  title?: string;
  description?: string;  image?: string;
  url?: string;
}

const MetaTags = ({
  title = 'Legal AI Assistant - Intelligent Legal Document Analysis',
  description = 'Transform your legal document workflow with AI-powered analysis, instant insights, and multilingual support. Save time and make better decisions with our advanced legal assistant.',
  image = '/logo.svg',
  url = 'https://legal-ai-assistant-api.vercel.app', // Replace with your actual domain
}: MetaTagsProps) => {
  return (
    <Helmet>
      {/* Standard metadata */}
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
    </Helmet>
  );
};

export default MetaTags;
