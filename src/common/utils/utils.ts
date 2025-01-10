import * as stem from 'wink-porter2-stemmer';
import stringComparison from 'string-comparison';

class Utils {
  public getDayBreakPoints(): {
    startOfDay: Date;
    endOfDay: Date;
  } {
    const today = new Date();

    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    return { startOfDay, endOfDay };
  }

  public getDateSubstractNDays(countDays: number) {
    const today = new Date();

    return new Date(today.getFullYear(), today.getMonth(), today.getDate() - countDays);
  }

  public groupBy(xs, key) {
    return xs.reduce((rv, x) => {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
  }

  private prepareText(text: string) {
    return text
      .split(/\s+/)
      .map((word) => stem(word))
      .join(' ');
  }

  public getSimilarityIndex(text1: string, text2: string) {
    const algorithm = stringComparison.jaroWinkler;

    return algorithm.similarity(this.prepareText(text1), this.prepareText(text2));
  }

  public getClosestAnswer(
    question: string,
    variants: string[]
  ): {
    index: number;
    variant: string;
    similarity: number;
  } {
    const closestVariant = variants
      .map((variant, index) => ({
        similarity: this.getSimilarityIndex(variant, question),
        index,
        variant,
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .shift();

    if (!closestVariant) {
      throw new Error(`Failed to get closest variant from: ${variants.join('; ')}`);
    }

    return closestVariant;
  }

  // Объект должен быть "плоским"
  public getClosestKeyOfObject<T extends object>(text: string, obj: T, excludedKeys: (keyof T)[] = []) {
    const keys = Object.keys(obj).filter((key) => !excludedKeys.includes(key as keyof T));
    return this.getClosestAnswer(text, keys);
  }

  public getClosestValueFromMapLike(text: string, values: [string, string[]][]): string | null {
    const closestKey = this.getClosestAnswer(
      text,
      values.map(([key]) => key)
    );

    const closestValue = values.find(([key]) => key === closestKey.variant);

    return closestValue ? closestValue[1][0] || null : null;
  }
}

export default new Utils();
