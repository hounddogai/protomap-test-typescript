import { RewardMapping } from "./reward-mapping.js";

/** A rule a reward mapping must pass. Check returns its problems, or none. */
export interface RewardMappingRule {
  check(item: RewardMapping): string[];
}

export class RewardMappingActiveGuardRule implements RewardMappingRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RewardMapping): string[] {
    if (item.active && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while active`];
    return [];
  }
}

export class RewardMappingRequiredNameRule implements RewardMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardMapping): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RewardMappingMinimumRangeRule implements RewardMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardMapping): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a reward mapping. */
export class RewardMappingValidator {
  rules: RewardMappingRule[];

  constructor(rules: RewardMappingRule[]) {
    this.rules = rules;
  }

  validate(item: RewardMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardMapping[]): Map<string, string[]> {
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

export function defaultRewardMappingValidator(): RewardMappingValidator {
  return new RewardMappingValidator(
    [
      new RewardMappingActiveGuardRule(3.8),
      new RewardMappingRequiredNameRule("reward mapping needs a value"),
      new RewardMappingMinimumRangeRule(3.8, 3447.5),
    ],
  );
}
