import { LenientRewardException } from "./lenient-reward-exception.js";

/** A rule a lenient reward exception must pass. Check returns its problems, or none. */
export interface LenientRewardExceptionRule {
  check(item: LenientRewardException): string[];
}

export class LenientRewardExceptionTimezoneLengthRule implements LenientRewardExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientRewardException): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientRewardExceptionSendAtRangeRule implements LenientRewardExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientRewardException): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientRewardExceptionRequiredCodeRule implements LenientRewardExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientRewardException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientRewardExceptionCodeLengthRule implements LenientRewardExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientRewardException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientRewardExceptionRequiredLabelRule implements LenientRewardExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientRewardException): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LenientRewardExceptionCodePrefixRule implements LenientRewardExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientRewardException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a lenient reward exception. */
export class LenientRewardExceptionValidator {
  rules: LenientRewardExceptionRule[];

  constructor(rules: LenientRewardExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: LenientRewardException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientRewardException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientRewardException[]): Map<string, string[]> {
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

export function defaultLenientRewardExceptionValidator(): LenientRewardExceptionValidator {
  return new LenientRewardExceptionValidator(
    [
      new LenientRewardExceptionTimezoneLengthRule(16),
      new LenientRewardExceptionSendAtRangeRule(16, 80),
      new LenientRewardExceptionRequiredCodeRule("lenient reward exception needs an entry"),
      new LenientRewardExceptionCodeLengthRule(1000),
      new LenientRewardExceptionRequiredLabelRule("lenient reward exception needs a value"),
      new LenientRewardExceptionCodePrefixRule("Q"),
    ],
  );
}
