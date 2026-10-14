import { GlobalLevelAdjustment } from "./global-level-adjustment.js";

/** A rule a global level adjustment must pass. Check returns its problems, or none. */
export interface GlobalLevelAdjustmentRule {
  check(item: GlobalLevelAdjustment): string[];
}

export class GlobalLevelAdjustmentQuantityRangeRule implements GlobalLevelAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalLevelAdjustment): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalLevelAdjustmentRequiredTimezoneRule implements GlobalLevelAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalLevelAdjustment): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalLevelAdjustmentAmountRangeRule implements GlobalLevelAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalLevelAdjustment): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a global level adjustment. */
export class GlobalLevelAdjustmentValidator {
  rules: GlobalLevelAdjustmentRule[];

  constructor(rules: GlobalLevelAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalLevelAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalLevelAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalLevelAdjustment[]): Map<string, string[]> {
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

export function defaultGlobalLevelAdjustmentValidator(): GlobalLevelAdjustmentValidator {
  return new GlobalLevelAdjustmentValidator(
    [
      new GlobalLevelAdjustmentQuantityRangeRule(3600, 86400),
      new GlobalLevelAdjustmentRequiredTimezoneRule("global level adjustment needs an entry"),
      new GlobalLevelAdjustmentAmountRangeRule(5.4, 4657.1),
    ],
  );
}
