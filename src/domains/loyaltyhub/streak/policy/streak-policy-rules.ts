import { StreakPolicy } from "./streak-policy.js";

/** A rule a streak policy must pass. Check returns its problems, or none. */
export interface StreakPolicyRule {
  check(item: StreakPolicy): string[];
}

export class StreakPolicyRequiredCodeRule implements StreakPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StreakPolicyCodeLengthRule implements StreakPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakPolicyNameLengthRule implements StreakPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakPolicy): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakPolicyRatioRangeRule implements StreakPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StreakPolicy): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a streak policy. */
export class StreakPolicyValidator {
  rules: StreakPolicyRule[];

  constructor(rules: StreakPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: StreakPolicy): string[] {
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

  requireValid(item: StreakPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakPolicy[]): Map<string, string[]> {
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

export function defaultStreakPolicyValidator(): StreakPolicyValidator {
  return new StreakPolicyValidator(
    [
      new StreakPolicyRequiredCodeRule("streak policy needs this field"),
      new StreakPolicyCodeLengthRule(120),
      new StreakPolicyNameLengthRule(3600),
      new StreakPolicyRatioRangeRule(8.4, 1004.6),
    ],
  );
}
