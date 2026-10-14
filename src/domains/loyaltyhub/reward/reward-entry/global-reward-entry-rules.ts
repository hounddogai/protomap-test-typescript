import { GlobalRewardEntry } from "./global-reward-entry.js";

/** A rule a global reward entry must pass. Check returns its problems, or none. */
export interface GlobalRewardEntryRule {
  check(item: GlobalRewardEntry): string[];
}

export class GlobalRewardEntryCodeLengthRule implements GlobalRewardEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalRewardEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalRewardEntryClicksRangeRule implements GlobalRewardEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalRewardEntry): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalRewardEntryVariantLengthRule implements GlobalRewardEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalRewardEntry): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalRewardEntryRequiredLocaleRule implements GlobalRewardEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRewardEntry): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalRewardEntryLocaleLengthRule implements GlobalRewardEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalRewardEntry): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalRewardEntryEndsAtRangeRule implements GlobalRewardEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalRewardEntry): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a global reward entry. */
export class GlobalRewardEntryValidator {
  rules: GlobalRewardEntryRule[];

  constructor(rules: GlobalRewardEntryRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalRewardEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalRewardEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalRewardEntry[]): Map<string, string[]> {
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

export function defaultGlobalRewardEntryValidator(): GlobalRewardEntryValidator {
  return new GlobalRewardEntryValidator(
    [
      new GlobalRewardEntryCodeLengthRule(3600),
      new GlobalRewardEntryClicksRangeRule(32, 1000),
      new GlobalRewardEntryVariantLengthRule(32),
      new GlobalRewardEntryRequiredLocaleRule("global reward entry needs a value"),
      new GlobalRewardEntryLocaleLengthRule(1000),
      new GlobalRewardEntryEndsAtRangeRule(32, 80),
    ],
  );
}
