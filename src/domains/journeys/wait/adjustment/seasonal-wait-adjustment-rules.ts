import { SeasonalWaitAdjustment } from "./seasonal-wait-adjustment.js";

/** A rule a seasonal wait adjustment must pass. Check returns its problems, or none. */
export interface SeasonalWaitAdjustmentRule {
  check(item: SeasonalWaitAdjustment): string[];
}

export class SeasonalWaitAdjustmentLabelLengthRule implements SeasonalWaitAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalWaitAdjustment): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalWaitAdjustmentRequiredLabelRule implements SeasonalWaitAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalWaitAdjustment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalWaitAdjustmentRevisionRangeRule implements SeasonalWaitAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalWaitAdjustment): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a seasonal wait adjustment. */
export class SeasonalWaitAdjustmentValidator {
  rules: SeasonalWaitAdjustmentRule[];

  constructor(rules: SeasonalWaitAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalWaitAdjustment): string[] {
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

  requireValid(item: SeasonalWaitAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalWaitAdjustment[]): Map<string, string[]> {
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

export function defaultSeasonalWaitAdjustmentValidator(): SeasonalWaitAdjustmentValidator {
  return new SeasonalWaitAdjustmentValidator(
    [
      new SeasonalWaitAdjustmentLabelLengthRule(32),
      new SeasonalWaitAdjustmentRequiredLabelRule("seasonal wait adjustment needs this field"),
      new SeasonalWaitAdjustmentRevisionRangeRule(32, 120),
    ],
  );
}
