import { WindowTier } from "./window-tier.js";

/** A rule a window tier must pass. Check returns its problems, or none. */
export interface WindowTierRule {
  check(item: WindowTier): string[];
}

export class WindowTierRequiredTitleRule implements WindowTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowTier): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WindowTierUpdatedAtRangeRule implements WindowTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowTier): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WindowTierStartsAtRangeRule implements WindowTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowTier): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WindowTierRequiredCodeRule implements WindowTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WindowTierTitleLengthRule implements WindowTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowTier): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowTierContactEmailLengthRule implements WindowTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowTier): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a window tier. */
export class WindowTierValidator {
  rules: WindowTierRule[];

  constructor(rules: WindowTierRule[]) {
    this.rules = rules;
  }

  validate(item: WindowTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WindowTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowTier[]): Map<string, string[]> {
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

export function defaultWindowTierValidator(): WindowTierValidator {
  return new WindowTierValidator(
    [
      new WindowTierRequiredTitleRule("window tier needs this field"),
      new WindowTierUpdatedAtRangeRule(3600, 3600),
      new WindowTierStartsAtRangeRule(120, 86400),
      new WindowTierRequiredCodeRule("window tier needs a value"),
      new WindowTierTitleLengthRule(64),
      new WindowTierContactEmailLengthRule(64),
    ],
  );
}
