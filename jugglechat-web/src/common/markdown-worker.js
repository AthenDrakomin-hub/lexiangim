import { wrap } from 'comlink';

let workerEndpoint = null;

function getEndpoint() {
  if (!workerEndpoint) {
    const worker = new Worker(
      new URL('../workers/markdown.worker.js', import.meta.url),
      { type: 'module' }
    );
    workerEndpoint = wrap(worker);
  }
  return workerEndpoint;
}

/**
 * Async markdown renderer via Web Worker (Comlink).
 * Avoids blocking the main thread for long markdown content.
 */
export async function formatMarkdownAsync(content) {
  if (!content) return '';
  try {
    const endpoint = await getEndpoint();
    return await endpoint.render(content);
  } catch (e) {
    console.warn('[markdown-worker] render failed, fallback:', e);
    return '';
  }
}
