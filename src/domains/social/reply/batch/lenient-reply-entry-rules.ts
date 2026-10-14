import { LenientReplyEntry } from "./lenient-reply-entry.js";

/** A rule a lenient reply entry must pass. Check returns its problems, or none. */
export interface LenientReplyEntryRule {
  check(item: LenientReplyEntry): string[];
}

export class LenientReplyEntryRequiredNameRule implements LenientReplyEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientReplyEntry): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LenientReplyEntryRequiredCodeRule implements LenientReplyEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientReplyEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientReplyEntryCodeLengthRule implements LenientReplyEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientReplyEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientReplyEntryClicksRangeRule implements LenientReplyEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientReplyEntry): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a lenient reply entry. */
export class LenientReplyEntryValidator {
  rules: LenientReplyEntryRule[];

  constructor(rules: LenientReplyEntryRule[]) {
    this.rules = rules;
  }

  validate(item: LenientReplyEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientReplyEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientReplyEntry[]): Map<string, string[]> {
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

export function defaultLenientReplyEntryValidator(): LenientReplyEntryValidator {
  return new LenientReplyEntryValidator(
    [
      new LenientReplyEntryRequiredNameRule("lenient reply entry needs this field"),
      new LenientReplyEntryRequiredCodeRule("lenient reply entry needs a value"),
      new LenientReplyEntryCodeLengthRule(1000),
      new LenientReplyEntryClicksRangeRule(64, 120),
    ],
  );
}
