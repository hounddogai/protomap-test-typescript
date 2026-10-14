import { CappedRewardRuleBatch } from "./capped-reward-rule-batch.js";

/** A rule a capped reward rule batch must pass. Check returns its problems, or none. */
export interface CappedRewardRuleBatchRule {
  check(item: CappedRewardRuleBatch): string[];
}

export class CappedRewardRuleBatchStartsAtRangeRule implements CappedRewardRuleBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedRewardRuleBatch): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedRewardRuleBatchRequiredCodeRule implements CappedRewardRuleBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedRewardRuleBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedRewardRuleBatchMarginRangeRule implements CappedRewardRuleBatchRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedRewardRuleBatch): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a capped reward rule batch. */
export class CappedRewardRuleBatchValidator {
  rules: CappedRewardRuleBatchRule[];

  constructor(rules: CappedRewardRuleBatchRule[]) {
    this.rules = rules;
  }

  validate(item: CappedRewardRuleBatch): string[] {
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

  requireValid(item: CappedRewardRuleBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedRewardRuleBatch[]): Map<string, string[]> {
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

export function defaultCappedRewardRuleBatchValidator(): CappedRewardRuleBatchValidator {
  return new CappedRewardRuleBatchValidator(
    [
      new CappedRewardRuleBatchStartsAtRangeRule(32, 80),
      new CappedRewardRuleBatchRequiredCodeRule("capped reward rule batch needs an entry"),
      new CappedRewardRuleBatchMarginRangeRule(0.6, 3905.8),
    ],
  );
}
