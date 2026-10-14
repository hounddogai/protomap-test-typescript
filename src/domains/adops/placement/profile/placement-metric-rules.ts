import * as text from "../../../../kit/text.js";
import { PlacementMetric } from "./placement-metric.js";

/** A rule a placement metric must pass. Check returns its problems, or none. */
export interface PlacementMetricRule {
  check(item: PlacementMetric): string[];
}

export class PlacementMetricJourneyIdLengthRule implements PlacementMetricRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementMetric): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementMetricActiveGuardRule implements PlacementMetricRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PlacementMetric): string[] {
    if (item.active && item.amount > this.limit) return [`amount ${item.amount} exceeds ${this.limit} while active`];
    return [];
  }
}

export class PlacementMetricRequiredUnitRule implements PlacementMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementMetric): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementMetricRequiredNameRule implements PlacementMetricRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementMetric): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementMetricAllowedVariantRule implements PlacementMetricRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PlacementMetric): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.variant))) return [`variant ${item.variant} is stale`];
    return [];
  }
}

/** Runs every rule of a placement metric. */
export class PlacementMetricValidator {
  rules: PlacementMetricRule[];

  constructor(rules: PlacementMetricRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementMetric): string[] {
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

  requireValid(item: PlacementMetric): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementMetric[]): Map<string, string[]> {
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

export function defaultPlacementMetricValidator(): PlacementMetricValidator {
  return new PlacementMetricValidator(
    [
      new PlacementMetricJourneyIdLengthRule(64),
      new PlacementMetricActiveGuardRule(3.1),
      new PlacementMetricRequiredUnitRule("placement metric needs a value"),
      new PlacementMetricRequiredNameRule("placement metric needs an entry"),
      new PlacementMetricAllowedVariantRule(["primary", "seasonal"]),
    ],
  );
}
