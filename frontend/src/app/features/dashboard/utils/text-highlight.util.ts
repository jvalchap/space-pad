export interface TextHighlightSegment {
  readonly text: string;
  readonly isMatch: boolean;
}

export function splitTextHighlightSegments(
  text: string,
  query: string,
): readonly TextHighlightSegment[] {
  const trimmedQuery = query.trim();
  if (trimmedQuery === '') {
    return [{ text, isMatch: false }];
  }
  const lowerText = text.toLowerCase();
  const lowerQuery = trimmedQuery.toLowerCase();
  const segments: TextHighlightSegment[] = [];
  let cursor = 0;
  let index = lowerText.indexOf(lowerQuery, cursor);
  while (index !== -1) {
    if (index > cursor) {
      segments.push({ text: text.slice(cursor, index), isMatch: false });
    }
    const end = index + trimmedQuery.length;
    segments.push({ text: text.slice(index, end), isMatch: true });
    cursor = end;
    index = lowerText.indexOf(lowerQuery, cursor);
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), isMatch: false });
  }
  return segments.length > 0 ? segments : [{ text, isMatch: false }];
}
