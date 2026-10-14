import { LenientSlaTier } from "./lenient-sla-tier.js";

/** A rule a lenient sla tier must pass. Check returns its problems, or none. */
export interface LenientSlaTierRule {
  check(item: LenientSlaTier): string[];
}

export class LenientSlaTierLabelLengthRule implements LenientSlaTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientSlaTier): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientSlaTierRequiredLocaleRule implements LenientSlaTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientSlaTier): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class LenientSlaTierRevisionRangeRule implements LenientSlaTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientSlaTier): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a lenient sla tier. */
export class LenientSlaTierValidator {
  rules: LenientSlaTierRule[];

  constructor(rules: LenientSlaTierRule[]) {
    this.rules = rules;
  }

  validate(item: LenientSlaTier): string[] {
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

  requireValid(item: LenientSlaTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientSlaTier[]): Map<string, string[]> {
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

export function defaultLenientSlaTierValidator(): LenientSlaTierValidator {
  return new LenientSlaTierValidator(
    [
      new LenientSlaTierLabelLengthRule(86400),
      new LenientSlaTierRequiredLocaleRule("lenient sla tier needs an entry"),
      new LenientSlaTierRevisionRangeRule(80, 120),
    ],
  );
}
