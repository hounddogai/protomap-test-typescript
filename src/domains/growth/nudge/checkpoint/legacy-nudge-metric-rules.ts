import * as text from "../../../../kit/text.js";
import { LegacyNudgeMetric } from "./legacy-nudge-metric.js";

/** A rule a legacy nudge metric must pass. Check returns its problems, or none. */
export interface LegacyNudgeMetricRule {
  check(item: LegacyNudgeMetric): string[];
}

export class LegacyNudgeMetricRequiredReviewerRule implements LegacyNudgeMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyNudgeMetric): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyNudgeMetricAllowedTitleRule implements LegacyNudgeMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyNudgeMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is blocked`];
    return [];
  }
}

export class LegacyNudgeMetricRequiredCohortRule implements LegacyNudgeMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyNudgeMetric): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy nudge metric. */
export class LegacyNudgeMetricValidator {
  rules: LegacyNudgeMetricRule[];

  constructor(rules: LegacyNudgeMetricRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyNudgeMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyNudgeMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyNudgeMetric[]): Map<string, string[]> {
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

export function defaultLegacyNudgeMetricValidator(): LegacyNudgeMetricValidator {
  return new LegacyNudgeMetricValidator(
    [
      new LegacyNudgeMetricRequiredReviewerRule("legacy nudge metric needs an entry"),
      new LegacyNudgeMetricAllowedTitleRule(["global", "fallback"]),
      new LegacyNudgeMetricRequiredCohortRule("legacy nudge metric needs an entry"),
    ],
  );
}
