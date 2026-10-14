import * as text from "../../../../kit/text.js";
import { PathMetric } from "./path-metric.js";

/** A rule a path metric must pass. Check returns its problems, or none. */
export interface PathMetricRule {
  check(item: PathMetric): string[];
}

export class PathMetricAllowedNameRule implements PathMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PathMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is below minimum`];
    return [];
  }
}

export class PathMetricFloorValueRangeRule implements PathMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathMetric): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PathMetricWindowDaysRangeRule implements PathMetricRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathMetric): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a path metric. */
export class PathMetricValidator {
  rules: PathMetricRule[];

  constructor(rules: PathMetricRule[]) {
    this.rules = rules;
  }

  validate(item: PathMetric): string[] {
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

  requireValid(item: PathMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathMetric[]): Map<string, string[]> {
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

export function defaultPathMetricValidator(): PathMetricValidator {
  return new PathMetricValidator(
    [
      new PathMetricAllowedNameRule(["default", "default"]),
      new PathMetricFloorValueRangeRule(2.3, 600.2),
      new PathMetricWindowDaysRangeRule(3600, 3600),
    ],
  );
}
