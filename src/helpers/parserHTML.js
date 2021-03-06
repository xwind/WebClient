import TurndownService from 'turndown';
import _ from 'lodash';

/**
 * Transform HTML to text
 * @param  {String}  html
 * @param  {Boolean} appendLines Append lines before the content if it starts with a Signature
 * @return {String}
 */
export function toText(html, appendLines = true) {

    const turndownService = new TurndownService({
        bulletListMarker: '-',
        strongDelimiter: '',
        emDelimiter: '',
        hr: ''
    });

    const protonSignature = {
        filter: (node) => node.classList.contains('protonmail_signature_block'),
        replacement(content) {
            return `\u200B${content.trim()}\u200B`;
        }
    };

    const replaceBreakLine = {
        filter: 'br',
        replacement(content, node) {

            // It matches the new line of a signature
            if (node.parentElement.nodeName === 'DIV' && node.parentElement.childElementCount === 1) {
                return !node.parentElement.textContent ? '\n\n' : '';
            }

            // ex <li>monique<br></li>
            if (node.parentElement.lastElementChild.nodeName === 'BR' && node.parentElement.textContent) {
                return '';
            }

            return '\n\n';
        }
    };
    const replaceImg = {
        filter: 'img',
        replacement: () => ''
    };

    const replaceAnchor = {
        filter: 'a',
        replacement(content, node) {
            return node.textContent;
        }
    };

    turndownService.use([
        () => turndownService.addRule('replaceAnchor', replaceAnchor),
        () => turndownService.addRule('replaceImg', replaceImg),
        () => turndownService.addRule('replaceBreakLine', replaceBreakLine),
        () => turndownService.addRule('protonSignature', protonSignature)
    ]);

    /**
     * Override turndown to NOT escape any HTML. For example MONO_TLS_PROVIDER -> MONO\_TLS\_PROVIDER.
     * Just return the value that is passed in.
     * Fixes https://github.com/ProtonMail/Angular/issues/6556
     */
    turndownService.escape = _.identity;

    const output = turndownService.turndown(html);

    // It's the signature, we need some space
    if (output.startsWith('\u200B') && appendLines) {
        return `\n\n\n${output}\n\n`;
    }

    return output;
}
