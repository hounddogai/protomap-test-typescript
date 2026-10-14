import * as text from "../../../../kit/text.js";
import { ManualPlacementThreshold } from "./manual-placement-threshold.js";

/** A rule a manual placement threshold must pass. Check returns its problems, or none. */
export interface ManualPlacementThresholdRule {
  check(item: ManualPlacementThreshold): string[];
}

export class ManualPlacementThresholdUnitLengthRule implements ManualPlacementThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualPlacementThreshold): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualPlacementThresholdRequiredUnitRule implements ManualPlacementThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPlacementThreshold): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPlacementThresholdAllowedUnitRule implements ManualPlacementThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualPlacementThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.unit))) return [`unit ${item.unit} is stale`];
    return [];
  }
}

export class ManualPlacementThresholdBatchSizeRangeRule implements ManualPlacementThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualPlacementThreshold): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualPlacementThresholdTitleLengthRule implements ManualPlacementThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualPlacementThreshold): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual placement threshold. */
export class ManualPlacementThresholdValidator {
  rules: ManualPlacementThresholdRule[];

  constructor(rules: ManualPlacementThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: ManualPlacementThreshold): string[] {
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

  requireValid(item: ManualPlacementThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualPlacementThreshold[]): Map<string, string[]> {
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

export function defaultManualPlacementThresholdValidator(): ManualPlacementThresholdValidator {
  return new ManualPlacementThresholdValidator(
    [
      new ManualPlacementThresholdUnitLengthRule(16),
      new ManualPlacementThresholdRequiredUnitRule("manual placement threshold needs a value"),
      new ManualPlacementThresholdAllowedUnitRule(["seasonal", "regional", "rolling"]),
      new ManualPlacementThresholdBatchSizeRangeRule(16, 64),
      new ManualPlacementThresholdTitleLengthRule(80),
    ],
  );
}
