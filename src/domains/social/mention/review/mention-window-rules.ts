import { MentionWindow } from "./mention-window.js";

/** A rule a mention window must pass. Check returns its problems, or none. */
export interface MentionWindowRule {
  check(item: MentionWindow): string[];
}

export class MentionWindowRequiredNameRule implements MentionWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionWindow): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class MentionWindowCodeLengthRule implements MentionWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MentionWindowWeightRangeRule implements MentionWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionWindow): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class MentionWindowGraceDaysRangeRule implements MentionWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionWindow): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class MentionWindowCodePrefixRule implements MentionWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: MentionWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class MentionWindowRequiredContactEmailRule implements MentionWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionWindow): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a mention window. */
export class MentionWindowValidator {
  rules: MentionWindowRule[];

  constructor(rules: MentionWindowRule[]) {
    this.rules = rules;
  }

  validate(item: MentionWindow): string[] {
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

  requireValid(item: MentionWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionWindow[]): Map<string, string[]> {
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

export function defaultMentionWindowValidator(): MentionWindowValidator {
  return new MentionWindowValidator(
    [
      new MentionWindowRequiredNameRule("mention window needs an entry"),
      new MentionWindowCodeLengthRule(120),
      new MentionWindowWeightRangeRule(7.8, 3787.3),
      new MentionWindowGraceDaysRangeRule(16, 86400),
      new MentionWindowCodePrefixRule("OPS"),
      new MentionWindowRequiredContactEmailRule("mention window needs a value"),
    ],
  );
}
