import React from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

import { App } from './App';

import 'normalize.css/normalize.css';
import './index.css';

Sentry.init({
    dsn: 'https://975c9c3321074313ab41c1380cbf4c3c@o1200738.ingest.sentry.io/6324846',
    integrations: [new BrowserTracing()],
    tracesSampleRate: 1.0,
});

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error('Missing root element!');
}
const root = createRoot(rootElement);

root.render(
    <React.StrictMode>
        <HelmetProvider>
            <App />
        </HelmetProvider>
    </React.StrictMode>
);
