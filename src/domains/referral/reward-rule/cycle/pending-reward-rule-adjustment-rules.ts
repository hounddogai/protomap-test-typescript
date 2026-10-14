import { PendingRewardRuleAdjustment } from "./pending-reward-rule-adjustment.js";

/** A rule a pending reward rule adjustment must pass. Check returns its problems, or none. */
export interface PendingRewardRuleAdjustmentRule {
  check(item: PendingRewardRuleAdjustment): string[];
}

export class PendingRewardRuleAdjustmentWeightRangeRule implements PendingRewardRuleAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingRewardRuleAdjustment): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingRewardRuleAdjustmentRequiredLabelRule implements PendingRewardRuleAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingRewardRuleAdjustment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PendingRewardRuleAdjustmentRatioRangeRule implements PendingRewardRuleAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingRewardRuleAdjustment): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingRewardRuleAdjustmentSourceLengthRule implements PendingRewardRuleAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingRewardRuleAdjustment): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingRewardRuleAdjustmentRequiredCodeRule implements PendingRewardRuleAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingRewardRuleAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending reward rule adjustment. */
export class PendingRewardRuleAdjustmentValidator {
  rules: PendingRewardRuleAdjustmentRule[];

  constructor(rules: PendingRewardRuleAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: PendingRewardRuleAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingRewardRuleAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingRewardRuleAdjustment[]): Map<string, string[]> {
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

export function defaultPendingRewardRuleAdjustmentValidator(): PendingRewardRuleAdjustmentValidator {
  return new PendingRewardRuleAdjustmentValidator(
    [
      new PendingRewardRuleAdjustmentWeightRangeRule(7.1, 2115.2),
      new PendingRewardRuleAdjustmentRequiredLabelRule("pending reward rule adjustment needs this field"),
      new PendingRewardRuleAdjustmentRatioRangeRule(9.9, 3528.9),
      new PendingRewardRuleAdjustmentSourceLengthRule(1000),
      new PendingRewardRuleAdjustmentRequiredCodeRule("pending reward rule adjustment needs this field"),
    ],
  );
}
