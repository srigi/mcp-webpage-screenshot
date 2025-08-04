import { describe, it, expect, beforeEach } from 'vitest';
import type { Variables } from '@modelcontextprotocol/sdk/shared/uriTemplate.js';
import { addScreenshot, handler, screenshotResources } from './index';

describe('Resource screenshots://{id} · handler()', () => {
  beforeEach(() => {
    screenshotResources.clear();
  });

  it('returns error for missing or non-string ID', () => {
    // Construct invalid cases but type them as Variables to satisfy signature without any
    const testCases: Variables[] = [
      {} as unknown as Variables,
      { id: undefined } as unknown as Variables,
      { id: null } as unknown as Variables,
      { id: 123 } as unknown as Variables,
    ];

    for (const variables of testCases) {
      const url = new URL('screenshots://123');
      const result = handler(url, variables);

      expect(result).toEqual({
        isError: true,
        contents: [{ text: 'Screenshot ID is incorrect or missing!', uri: url.href }],
      });
    }
  });

  it('returns error when ID is not found in registry', () => {
    const variables = { id: '999' };
    const url = new URL('screenshots://999');
    const result = handler(url, variables);

    expect(result).toEqual({
      isError: true,
      contents: [{ text: 'Requested resource not found!', uri: url.href }],
    });
  });

  it('returns resource when ID is found', () => {
    const buffer = Buffer.from('test screenshot data');
    const mimeType = 'image/png';
    const id = 123;
    const resourceText = 'test-page.html';

    const [expectedUri, expectedResource] = addScreenshot(buffer, mimeType, resourceText, id);
    const url = new URL(expectedUri);

    const result = handler(url, { id: String(id) });

    expect(result.contents).toHaveLength(1);
    expect(result.contents[0]).toEqual(expectedResource);
    expect(result.isError).toBeFalsy();
  });

  it('adding the Resource returns it', () => {
    const buffer = Buffer.from('test screenshot data');
    const mimeType = 'image/png';
    const id = 123;
    const resourceText = 'test-page.html';

    const initialSize = screenshotResources.size;
    const [expectedUri, expectedResource] = addScreenshot(buffer, mimeType, resourceText, id);
    const url = new URL(expectedUri);

    handler(url, { id: String(id) });

    expect(screenshotResources.size).toBe(initialSize + 1);
    expect(screenshotResources.get(id)).toEqual(expectedResource);
  });

  it('parses integer IDs robustly', () => {
    const buffer = Buffer.from('test screenshot data');
    const mimeType = 'image/png';
    const id = 123;
    const resourceText = 'test-page.html';

    const [expectedUri, expectedResource] = addScreenshot(buffer, mimeType, resourceText, id);
    const url = new URL(expectedUri);
    const testCases: Variables[] = [{ id: '000123' }, { id: ' 123 ' }, { id: '123' }];

    for (const variables of testCases) {
      const result = handler(url, variables);
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0]).toEqual(expectedResource);
    }
  });

  it('returns not found for non-numeric IDs', () => {
    const variables = { id: 'nonnumeric' };
    const url = new URL('screenshots://nonnumeric');
    const result = handler(url, variables);

    expect(result).toEqual({
      isError: true,
      contents: [{ text: 'Requested resource not found!', uri: url.href }],
    });
  });
});
