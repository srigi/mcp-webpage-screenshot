import { describe, it, expect, beforeEach } from 'vitest';

import { addScreenshot, screenshotResources } from './index';

describe('Resource screenshots://{id} · addScreenshot()', () => {
  beforeEach(() => {
    screenshotResources.clear();
  });

  it('adds a screenshot to the map with correct structure', () => {
    const buffer = Buffer.from('test data');
    const mimeType = 'image/png';
    const resourceText = 'test.html';
    const id = 123456789;

    const [uri, resource] = addScreenshot(buffer, mimeType, resourceText, id);

    expect(typeof uri).toBe('string');
    expect(typeof resource).toBe('object');
    expect(screenshotResources.size).toBe(1);
    expect(screenshotResources.has(id)).toBe(true);
    expect(resource).toEqual({
      blob: `data:${mimeType};base64,${buffer.toString('base64')}`,
      mimeType,
      text: `Screenshot of ${resourceText}`,
      uri: `screenshots://${id}`,
    });
  });

  it('handles multiple screenshots with different IDs', () => {
    const buffer1 = Buffer.from('first screenshot');
    const buffer2 = Buffer.from('second screenshot');
    const mimeType = 'image/png';
    const id1 = 111;
    const id2 = 222;

    const [uri1, resource1] = addScreenshot(buffer1, mimeType, 'first screenshot', id1);
    const [uri2, resource2] = addScreenshot(buffer2, mimeType, 'second screenshot', id2);

    expect(uri1).toBe('screenshots://111');
    expect(uri2).toBe('screenshots://222');
    expect(screenshotResources.size).toBe(2);
    expect(screenshotResources.has(id1)).toBe(true);
    expect(screenshotResources.has(id2)).toBe(true);
    expect(resource1.text).toBe('Screenshot of first screenshot');
    expect(resource2.text).toBe('Screenshot of second screenshot');
  });

  it('handles different MIME types correctly', () => {
    const testCases = [
      { data: 'jpeg data', mimeType: 'image/jpeg' },
      { data: 'webp data', mimeType: 'image/webp' },
      { data: 'gif data', mimeType: 'image/gif' },
    ];
    let id = 111;

    for (const { mimeType, data } of testCases) {
      const buffer = Buffer.from(data);
      const [, resource] = addScreenshot(buffer, mimeType, `test.${mimeType.split('/')[1]}`, id++);

      expect(resource.mimeType).toBe(mimeType);
      expect(resource.blob).toBe(`data:${mimeType};base64,${buffer.toString('base64')}`);
    }

    expect(screenshotResources.size).toBe(testCases.length);
  });

  it('handles empty buffer', () => {
    const buffer = Buffer.alloc(0);
    const mimeType = 'image/png';
    const resourceText = 'null';
    const id = 1;

    const [, resource] = addScreenshot(buffer, mimeType, resourceText, id);

    expect(screenshotResources.size).toBe(1);
    expect(screenshotResources.has(id)).toBe(true);
    expect(resource.blob).toBe(`data:${mimeType};base64,`);
  });

  it('handles different URI formats in text field', () => {
    const buffer = Buffer.from('test data');
    const mimeType = 'image/png';
    const testUris = ['https://example.com/page.html', 'file:///local/path/page.html', 'screenshots://nested/path/file.png'];

    let id = 1;
    for (const testUri of testUris) {
      const [, resource] = addScreenshot(buffer, mimeType, testUri, id++);
      expect(resource.text).toBe(`Screenshot of ${testUri}`);
    }

    expect(screenshotResources.size).toBe(testUris.length);
  });

  it('maintains correct map state with sequential additions', () => {
    const initialSize = screenshotResources.size;
    const buffer = Buffer.from('test data');
    const mimeType = 'image/png';

    // Add multiple screenshots
    const screenshots = [];
    for (let i = 0; i < 5; i++) {
      const [uri, resource] = addScreenshot(buffer, mimeType, `test${i}.html`, i);
      screenshots.push({ uri, resource, id: i });

      expect(screenshotResources.size).toBe(initialSize + i + 1);
    }

    // Verify all screenshots are still in the map
    screenshots.forEach(({ id, resource }) => {
      expect(screenshotResources.has(id)).toBe(true);
      expect(screenshotResources.get(id)).toEqual(resource);
    });
  });

  it('throws error when adding screenshot with duplicate ID', () => {
    const buffer = Buffer.from('test data');
    const mimeType = 'image/png';
    const id = 123;

    // Add first screenshot
    addScreenshot(buffer, mimeType, 'first.html', id);
    expect(screenshotResources.size).toBe(1);

    // Try to add second screenshot with same ID
    expect(() => {
      addScreenshot(buffer, mimeType, 'second.html', id);
    }).toThrow('Screenshot with ID 123 already exists');

    // Verify only one screenshot remains
    expect(screenshotResources.size).toBe(1);
  });
});
