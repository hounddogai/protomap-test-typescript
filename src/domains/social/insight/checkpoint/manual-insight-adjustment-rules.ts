import * as text from "../../../../kit/text.js";
import { ManualInsightAdjustment } from "./manual-insight-adjustment.js";

/** A rule a manual insight adjustment must pass. Check returns its problems, or none. */
export interface ManualInsightAdjustmentRule {
  check(item: ManualInsightAdjustment): string[];
}

export class ManualInsightAdjustmentRequiredCodeRule implements ManualInsightAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualInsightAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualInsightAdjustmentCapacityRangeRule implements ManualInsightAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualInsightAdjustment): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualInsightAdjustmentAllowedTitleRule implements ManualInsightAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualInsightAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is stale`];
    return [];
  }
}

export class ManualInsightAdjustmentRequiredRegionRule implements ManualInsightAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualInsightAdjustment): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual insight adjustment. */
export class ManualInsightAdjustmentValidator {
  rules: ManualInsightAdjustmentRule[];

  constructor(rules: ManualInsightAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: ManualInsightAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualInsightAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualInsightAdjustment[]): Map<string, string[]> {
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

export function defaultManualInsightAdjustmentValidator(): ManualInsightAdjustmentValidator {
  return new ManualInsightAdjustmentValidator(
    [
      new ManualInsightAdjustmentRequiredCodeRule("manual insight adjustment needs an entry"),
      new ManualInsightAdjustmentCapacityRangeRule(64, 255),
      new ManualInsightAdjustmentAllowedTitleRule(["scheduled", "capped", "capped"]),
      new ManualInsightAdjustmentRequiredRegionRule("manual insight adjustment needs a value"),
    ],
  );
}
