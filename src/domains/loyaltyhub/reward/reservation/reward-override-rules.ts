import { RewardOverride } from "./reward-override.js";

/** A rule a reward override must pass. Check returns its problems, or none. */
export interface RewardOverrideRule {
  check(item: RewardOverride): string[];
}

export class RewardOverrideCapacityRangeRule implements RewardOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardOverride): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RewardOverrideCodeLengthRule implements RewardOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardOverrideLabelLengthRule implements RewardOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardOverride): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardOverrideCodePrefixRule implements RewardOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RewardOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RewardOverrideRequiredCodeRule implements RewardOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RewardOverrideRequiredLabelRule implements RewardOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardOverride): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reward override. */
export class RewardOverrideValidator {
  rules: RewardOverrideRule[];

  constructor(rules: RewardOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: RewardOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardOverride[]): Map<string, string[]> {
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

export function defaultRewardOverrideValidator(): RewardOverrideValidator {
  return new RewardOverrideValidator(
    [
      new RewardOverrideCapacityRangeRule(32, 120),
      new RewardOverrideCodeLengthRule(64),
      new RewardOverrideLabelLengthRule(1000),
      new RewardOverrideCodePrefixRule("Q"),
      new RewardOverrideRequiredCodeRule("reward override needs an entry"),
      new RewardOverrideRequiredLabelRule("reward override needs a value"),
    ],
  );
}
