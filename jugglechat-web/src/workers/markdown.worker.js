import MarkdownIt from 'markdown-it';
import { expose } from 'comlink';

const md = MarkdownIt();

expose({
  render(content) {
    if (!content) return '';
    return md.render(content);
  }
});
