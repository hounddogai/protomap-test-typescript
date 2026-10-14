import * as text from "../../../../kit/text.js";
import { RewardMetric } from "./reward-metric.js";

/** A rule a reward metric must pass. Check returns its problems, or none. */
export interface RewardMetricRule {
  check(item: RewardMetric): string[];
}

export class RewardMetricRequiredTitleRule implements RewardMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardMetric): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RewardMetricAllowedTitleRule implements RewardMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RewardMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is above maximum`];
    return [];
  }
}

export class RewardMetricCodePrefixRule implements RewardMetricRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RewardMetric): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a reward metric. */
export class RewardMetricValidator {
  rules: RewardMetricRule[];

  constructor(rules: RewardMetricRule[]) {
    this.rules = rules;
  }

  validate(item: RewardMetric): string[] {
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

  requireValid(item: RewardMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardMetric[]): Map<string, string[]> {
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

export function defaultRewardMetricValidator(): RewardMetricValidator {
  return new RewardMetricValidator(
    [
      new RewardMetricRequiredTitleRule("reward metric needs an entry"),
      new RewardMetricAllowedTitleRule(["manual", "seasonal", "weighted"]),
      new RewardMetricCodePrefixRule("OPS"),
    ],
  );
}
