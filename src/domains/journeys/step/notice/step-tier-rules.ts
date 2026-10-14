import { StepTier } from "./step-tier.js";

/** A rule a step tier must pass. Check returns its problems, or none. */
export interface StepTierRule {
  check(item: StepTier): string[];
}

export class StepTierCodePrefixRule implements StepTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StepTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StepTierBudgetRangeRule implements StepTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepTier): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StepTierCodeLengthRule implements StepTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepTier): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepTierRequiredCodeRule implements StepTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepTier): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StepTierTitleLengthRule implements StepTierRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepTier): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepTierRequiredTitleRule implements StepTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepTier): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a step tier. */
export class StepTierValidator {
  rules: StepTierRule[];

  constructor(rules: StepTierRule[]) {
    this.rules = rules;
  }

  validate(item: StepTier): string[] {
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

  requireValid(item: StepTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepTier[]): Map<string, string[]> {
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

export function defaultStepTierValidator(): StepTierValidator {
  return new StepTierValidator(
    [
      new StepTierCodePrefixRule("Q"),
      new StepTierBudgetRangeRule(6.9, 4358.6),
      new StepTierCodeLengthRule(64),
      new StepTierRequiredCodeRule("step tier needs this field"),
      new StepTierTitleLengthRule(120),
      new StepTierRequiredTitleRule("step tier needs an entry"),
    ],
  );
}
