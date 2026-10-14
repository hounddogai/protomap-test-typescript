import { LenientCsatWindow } from "./lenient-csat-window.js";

/** A rule a lenient csat window must pass. Check returns its problems, or none. */
export interface LenientCsatWindowRule {
  check(item: LenientCsatWindow): string[];
}

export class LenientCsatWindowScoreRangeRule implements LenientCsatWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientCsatWindow): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientCsatWindowApprovedGuardRule implements LenientCsatWindowRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LenientCsatWindow): string[] {
    if (item.approved && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class LenientCsatWindowRequiredCodeRule implements LenientCsatWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientCsatWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientCsatWindowLabelLengthRule implements LenientCsatWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientCsatWindow): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientCsatWindowCodePrefixRule implements LenientCsatWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientCsatWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientCsatWindowRequiredVariantRule implements LenientCsatWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientCsatWindow): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient csat window. */
export class LenientCsatWindowValidator {
  rules: LenientCsatWindowRule[];

  constructor(rules: LenientCsatWindowRule[]) {
    this.rules = rules;
  }

  validate(item: LenientCsatWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientCsatWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientCsatWindow[]): Map<string, string[]> {
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

export function defaultLenientCsatWindowValidator(): LenientCsatWindowValidator {
  return new LenientCsatWindowValidator(
    [
      new LenientCsatWindowScoreRangeRule(8.5, 4105.7),
      new LenientCsatWindowApprovedGuardRule(5.4),
      new LenientCsatWindowRequiredCodeRule("lenient csat window needs an entry"),
      new LenientCsatWindowLabelLengthRule(255),
      new LenientCsatWindowCodePrefixRule("ACM"),
      new LenientCsatWindowRequiredVariantRule("lenient csat window needs a value"),
    ],
  );
}
