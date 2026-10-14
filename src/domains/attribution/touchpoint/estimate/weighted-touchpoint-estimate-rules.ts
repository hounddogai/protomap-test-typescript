import * as text from "../../../../kit/text.js";
import { WeightedTouchpointEstimate } from "./weighted-touchpoint-estimate.js";

/** A rule a weighted touchpoint estimate must pass. Check returns its problems, or none. */
export interface WeightedTouchpointEstimateRule {
  check(item: WeightedTouchpointEstimate): string[];
}

export class WeightedTouchpointEstimateRequiredNameRule implements WeightedTouchpointEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedTouchpointEstimate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedTouchpointEstimateApprovedGuardRule implements WeightedTouchpointEstimateRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: WeightedTouchpointEstimate): string[] {
    if (item.approved && item.rate > this.limit) return [`rate ${item.rate} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class WeightedTouchpointEstimateAllowedNameRule implements WeightedTouchpointEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedTouchpointEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is too long`];
    return [];
  }
}

/** Runs every rule of a weighted touchpoint estimate. */
export class WeightedTouchpointEstimateValidator {
  rules: WeightedTouchpointEstimateRule[];

  constructor(rules: WeightedTouchpointEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedTouchpointEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedTouchpointEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedTouchpointEstimate[]): Map<string, string[]> {
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

export function defaultWeightedTouchpointEstimateValidator(): WeightedTouchpointEstimateValidator {
  return new WeightedTouchpointEstimateValidator(
    [
      new WeightedTouchpointEstimateRequiredNameRule("weighted touchpoint estimate needs a value"),
      new WeightedTouchpointEstimateApprovedGuardRule(1.2),
      new WeightedTouchpointEstimateAllowedNameRule(["regional", "global", "scheduled"]),
    ],
  );
}
