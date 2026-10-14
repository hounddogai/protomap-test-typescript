import { FallbackPreferenceItem } from "./fallback-preference-item.js";

/** A rule a fallback preference item must pass. Check returns its problems, or none. */
export interface FallbackPreferenceItemRule {
  check(item: FallbackPreferenceItem): string[];
}

export class FallbackPreferenceItemTitleLengthRule implements FallbackPreferenceItemRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackPreferenceItem): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackPreferenceItemBudgetRangeRule implements FallbackPreferenceItemRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackPreferenceItem): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackPreferenceItemOwnerIdLengthRule implements FallbackPreferenceItemRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackPreferenceItem): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackPreferenceItemCodePrefixRule implements FallbackPreferenceItemRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackPreferenceItem): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackPreferenceItemRequiredCodeRule implements FallbackPreferenceItemRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackPreferenceItem): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackPreferenceItemRequiredOwnerIdRule implements FallbackPreferenceItemRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackPreferenceItem): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback preference item. */
export class FallbackPreferenceItemValidator {
  rules: FallbackPreferenceItemRule[];

  constructor(rules: FallbackPreferenceItemRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackPreferenceItem): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackPreferenceItem): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackPreferenceItem[]): Map<string, string[]> {
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

export function defaultFallbackPreferenceItemValidator(): FallbackPreferenceItemValidator {
  return new FallbackPreferenceItemValidator(
    [
      new FallbackPreferenceItemTitleLengthRule(1000),
      new FallbackPreferenceItemBudgetRangeRule(1.1, 2182),
      new FallbackPreferenceItemOwnerIdLengthRule(120),
      new FallbackPreferenceItemCodePrefixRule("REF"),
      new FallbackPreferenceItemRequiredCodeRule("fallback preference item needs this field"),
      new FallbackPreferenceItemRequiredOwnerIdRule("fallback preference item needs an entry"),
    ],
  );
}
