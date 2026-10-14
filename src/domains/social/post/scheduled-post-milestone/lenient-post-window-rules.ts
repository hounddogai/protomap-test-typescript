import { LenientPostWindow } from "./lenient-post-window.js";

/** A rule a lenient post window must pass. Check returns its problems, or none. */
export interface LenientPostWindowRule {
  check(item: LenientPostWindow): string[];
}

export class LenientPostWindowRequiredLabelRule implements LenientPostWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientPostWindow): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LenientPostWindowLocaleLengthRule implements LenientPostWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientPostWindow): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientPostWindowStartsAtRangeRule implements LenientPostWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientPostWindow): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientPostWindowRequiredCodeRule implements LenientPostWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientPostWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient post window. */
export class LenientPostWindowValidator {
  rules: LenientPostWindowRule[];

  constructor(rules: LenientPostWindowRule[]) {
    this.rules = rules;
  }

  validate(item: LenientPostWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      const found = rule.check(item);
      if (found.length === 0) continue;
      for (const problem of found) {
        problems.push(`${item.code}: ${problem}`);
      }
    }
    return problems;
  }

  requireValid(item: LenientPostWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientPostWindow[]): Map<string, string[]> {
    const report = new Map<string, string[]>();
    for (const item of items) {
      const problems = this.validate(item);
      if (problems.length > 0) {
        report.set(item.code, problems);
      }
    }
    return report;
  }
}

export function defaultLenientPostWindowValidator(): LenientPostWindowValidator {
  return new LenientPostWindowValidator(
    [
      new LenientPostWindowRequiredLabelRule("lenient post window needs an entry"),
      new LenientPostWindowLocaleLengthRule(120),
      new LenientPostWindowStartsAtRangeRule(120, 120),
      new LenientPostWindowRequiredCodeRule("lenient post window needs a value"),
    ],
  );
}
