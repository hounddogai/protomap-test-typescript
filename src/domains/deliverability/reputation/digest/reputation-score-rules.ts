import { ReputationScore } from "./reputation-score.js";

/** A rule a reputation score must pass. Check returns its problems, or none. */
export interface ReputationScoreRule {
  check(item: ReputationScore): string[];
}

export class ReputationScoreTagsLimitRule implements ReputationScoreRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: ReputationScore): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class ReputationScoreCreatedAtRangeRule implements ReputationScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationScore): string[] {
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

export class ReputationScoreCodePrefixRule implements ReputationScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ReputationScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a reputation score. */
export class ReputationScoreValidator {
  rules: ReputationScoreRule[];

  constructor(rules: ReputationScoreRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ReputationScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationScore[]): Map<string, string[]> {
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

export function defaultReputationScoreValidator(): ReputationScoreValidator {
  return new ReputationScoreValidator(
    [
      new ReputationScoreTagsLimitRule(16, ["regional", "strict"]),
      new ReputationScoreCreatedAtRangeRule(32, 64),
      new ReputationScoreCodePrefixRule("OPS"),
    ],
  );
}
