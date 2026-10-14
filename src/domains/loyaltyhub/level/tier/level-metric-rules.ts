import * as text from "../../../../kit/text.js";
import { LevelMetric } from "./level-metric.js";

/** A rule a level metric must pass. Check returns its problems, or none. */
export interface LevelMetricRule {
  check(item: LevelMetric): string[];
}

export class LevelMetricVariantLengthRule implements LevelMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelMetric): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelMetricLocaleLengthRule implements LevelMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelMetric): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelMetricAllowedCodeRule implements LevelMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LevelMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

/** Runs every rule of a level metric. */
export class LevelMetricValidator {
  rules: LevelMetricRule[];

  constructor(rules: LevelMetricRule[]) {
    this.rules = rules;
  }

  validate(item: LevelMetric): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LevelMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelMetric[]): Map<string, string[]> {
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

export function defaultLevelMetricValidator(): LevelMetricValidator {
  return new LevelMetricValidator(
    [
      new LevelMetricVariantLengthRule(80),
      new LevelMetricLocaleLengthRule(16),
      new LevelMetricAllowedCodeRule(["global"]),
    ],
  );
}
