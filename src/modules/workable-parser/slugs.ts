export default abstract class SlugWorker {
  private static readonly EN_ALPHABET_UNICODE_OFFSET = 97;

  public static unwrapSlug(slug: string): number | null {
    const id = Number(
      slug
        .split('_')
        .pop()
        ?.split('')
        .map((c) => c.charCodeAt(0) - this.EN_ALPHABET_UNICODE_OFFSET)
        .join('')
    );

    return Number.isNaN(id) ? null : id < 0 ? null : id;
  }

  public static wrapSlug({ title, id }: { title: string; id: number }): string {
    return this.wrapString(title).concat(
      '_',
      id
        .toString()
        .split('')
        .map((n: string) => String.fromCharCode(Number(n) + this.EN_ALPHABET_UNICODE_OFFSET))
        .join('')
    );
  }

  public static wrapString(target: string): string {
    return target
      .trim()
      .replace(/[_\-\.\+\(\)]+/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .toLowerCase();
  }

  public static unwrapString(target: string): string {
    return target.replace(/_+/g, ' ');
  }
}
