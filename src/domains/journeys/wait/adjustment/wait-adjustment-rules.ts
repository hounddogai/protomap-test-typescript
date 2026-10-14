import { WaitAdjustment } from "./wait-adjustment.js";

/** A rule a wait adjustment must pass. Check returns its problems, or none. */
export interface WaitAdjustmentRule {
  check(item: WaitAdjustment): string[];
}

export class WaitAdjustmentRequiredUtmSourceRule implements WaitAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitAdjustment): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class WaitAdjustmentUtmSourceLengthRule implements WaitAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitAdjustment): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WaitAdjustmentRetriesRangeRule implements WaitAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitAdjustment): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WaitAdjustmentImpressionsRangeRule implements WaitAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitAdjustment): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WaitAdjustmentRequiredCodeRule implements WaitAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WaitAdjustmentCeilingRangeRule implements WaitAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitAdjustment): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a wait adjustment. */
export class WaitAdjustmentValidator {
  rules: WaitAdjustmentRule[];

  constructor(rules: WaitAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: WaitAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WaitAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitAdjustment[]): Map<string, string[]> {
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

export function defaultWaitAdjustmentValidator(): WaitAdjustmentValidator {
  return new WaitAdjustmentValidator(
    [
      new WaitAdjustmentRequiredUtmSourceRule("wait adjustment needs a value"),
      new WaitAdjustmentUtmSourceLengthRule(16),
      new WaitAdjustmentRetriesRangeRule(120, 3600),
      new WaitAdjustmentImpressionsRangeRule(64, 3600),
      new WaitAdjustmentRequiredCodeRule("wait adjustment needs an entry"),
      new WaitAdjustmentCeilingRangeRule(2.3, 4157.9),
    ],
  );
}
