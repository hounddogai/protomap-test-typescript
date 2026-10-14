import { RewardPolicy } from "./reward-policy.js";

/** A rule a reward policy must pass. Check returns its problems, or none. */
export interface RewardPolicyRule {
  check(item: RewardPolicy): string[];
}

export class RewardPolicyCreatedAtRangeRule implements RewardPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardPolicy): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RewardPolicyNameLengthRule implements RewardPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardPolicy): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardPolicyRequiredNameRule implements RewardPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardPolicy): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reward policy. */
export class RewardPolicyValidator {
  rules: RewardPolicyRule[];

  constructor(rules: RewardPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: RewardPolicy): string[] {
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

  requireValid(item: RewardPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardPolicy[]): Map<string, string[]> {
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

export function defaultRewardPolicyValidator(): RewardPolicyValidator {
  return new RewardPolicyValidator(
    [
      new RewardPolicyCreatedAtRangeRule(120, 120),
      new RewardPolicyNameLengthRule(255),
      new RewardPolicyRequiredNameRule("reward policy needs an entry"),
    ],
  );
}
