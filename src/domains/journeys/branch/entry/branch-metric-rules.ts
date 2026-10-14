import * as text from "../../../../kit/text.js";
import { BranchMetric } from "./branch-metric.js";

/** A rule a branch metric must pass. Check returns its problems, or none. */
export interface BranchMetricRule {
  check(item: BranchMetric): string[];
}

export class BranchMetricChannelLengthRule implements BranchMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BranchMetric): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BranchMetricRequiredNameRule implements BranchMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchMetric): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BranchMetricAllowedNameRule implements BranchMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BranchMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is inconsistent`];
    return [];
  }
}

export class BranchMetricRequiredChannelRule implements BranchMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchMetric): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a branch metric. */
export class BranchMetricValidator {
  rules: BranchMetricRule[];

  constructor(rules: BranchMetricRule[]) {
    this.rules = rules;
  }

  validate(item: BranchMetric): string[] {
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

  requireValid(item: BranchMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchMetric[]): Map<string, string[]> {
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

export function defaultBranchMetricValidator(): BranchMetricValidator {
  return new BranchMetricValidator(
    [
      new BranchMetricChannelLengthRule(80),
      new BranchMetricRequiredNameRule("branch metric needs this field"),
      new BranchMetricAllowedNameRule(["primary", "adaptive", "capped"]),
      new BranchMetricRequiredChannelRule("branch metric needs a value"),
    ],
  );
}
