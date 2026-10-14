import { ReputationAdjustment } from "./reputation-adjustment.js";

/** A rule a reputation adjustment must pass. Check returns its problems, or none. */
export interface ReputationAdjustmentRule {
  check(item: ReputationAdjustment): string[];
}

export class ReputationAdjustmentRequiredLabelRule implements ReputationAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationAdjustment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationAdjustmentLabelLengthRule implements ReputationAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationAdjustment): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReputationAdjustmentCodePrefixRule implements ReputationAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ReputationAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ReputationAdjustmentCapacityRangeRule implements ReputationAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationAdjustment): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReputationAdjustmentImpressionsRangeRule implements ReputationAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationAdjustment): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReputationAdjustmentFloorValueRangeRule implements ReputationAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationAdjustment): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a reputation adjustment. */
export class ReputationAdjustmentValidator {
  rules: ReputationAdjustmentRule[];

  constructor(rules: ReputationAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ReputationAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationAdjustment[]): Map<string, string[]> {
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

export function defaultReputationAdjustmentValidator(): ReputationAdjustmentValidator {
  return new ReputationAdjustmentValidator(
    [
      new ReputationAdjustmentRequiredLabelRule("reputation adjustment needs this field"),
      new ReputationAdjustmentLabelLengthRule(3600),
      new ReputationAdjustmentCodePrefixRule("OPS"),
      new ReputationAdjustmentCapacityRangeRule(1000, 3600),
      new ReputationAdjustmentImpressionsRangeRule(1000, 1000),
      new ReputationAdjustmentFloorValueRangeRule(3.9, 2942.2),
    ],
  );
}
