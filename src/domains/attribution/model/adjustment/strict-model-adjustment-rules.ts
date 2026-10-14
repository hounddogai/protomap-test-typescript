import { StrictModelAdjustment } from "./strict-model-adjustment.js";

/** A rule a strict model adjustment must pass. Check returns its problems, or none. */
export interface StrictModelAdjustmentRule {
  check(item: StrictModelAdjustment): string[];
}

export class StrictModelAdjustmentRequiredCodeRule implements StrictModelAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictModelAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictModelAdjustmentFloorValueRangeRule implements StrictModelAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictModelAdjustment): string[] {
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

export class StrictModelAdjustmentPhoneLengthRule implements StrictModelAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictModelAdjustment): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict model adjustment. */
export class StrictModelAdjustmentValidator {
  rules: StrictModelAdjustmentRule[];

  constructor(rules: StrictModelAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: StrictModelAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictModelAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictModelAdjustment[]): Map<string, string[]> {
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

export function defaultStrictModelAdjustmentValidator(): StrictModelAdjustmentValidator {
  return new StrictModelAdjustmentValidator(
    [
      new StrictModelAdjustmentRequiredCodeRule("strict model adjustment needs a value"),
      new StrictModelAdjustmentFloorValueRangeRule(8.5, 904.4),
      new StrictModelAdjustmentPhoneLengthRule(1000),
    ],
  );
}
