import * as text from "../../../../kit/text.js";
import { NudgeMetric } from "./nudge-metric.js";

/** A rule a nudge metric must pass. Check returns its problems, or none. */
export interface NudgeMetricRule {
  check(item: NudgeMetric): string[];
}

export class NudgeMetricAudienceIdLengthRule implements NudgeMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeMetric): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeMetricAllowedAudienceIdRule implements NudgeMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: NudgeMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.audienceId))) return [`audience id ${item.audienceId} is below minimum`];
    return [];
  }
}

export class NudgeMetricLabelLengthRule implements NudgeMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeMetric): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeMetricVisibleGuardRule implements NudgeMetricRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: NudgeMetric): string[] {
    if (item.visible && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class NudgeMetricCodeLengthRule implements NudgeMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeMetric): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a nudge metric. */
export class NudgeMetricValidator {
  rules: NudgeMetricRule[];

  constructor(rules: NudgeMetricRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: NudgeMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeMetric[]): Map<string, string[]> {
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

export function defaultNudgeMetricValidator(): NudgeMetricValidator {
  return new NudgeMetricValidator(
    [
      new NudgeMetricAudienceIdLengthRule(64),
      new NudgeMetricAllowedAudienceIdRule(["batched", "default", "adaptive"]),
      new NudgeMetricLabelLengthRule(64),
      new NudgeMetricVisibleGuardRule(3.6),
      new NudgeMetricCodeLengthRule(3600),
    ],
  );
}
