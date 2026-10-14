import { StepAdjustment } from "./step-adjustment.js";

/** A rule a step adjustment must pass. Check returns its problems, or none. */
export interface StepAdjustmentRule {
  check(item: StepAdjustment): string[];
}

export class StepAdjustmentCountryLengthRule implements StepAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepAdjustment): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepAdjustmentRequiredCountryRule implements StepAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepAdjustment): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class StepAdjustmentMinimumRangeRule implements StepAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepAdjustment): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StepAdjustmentTitleLengthRule implements StepAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepAdjustment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a step adjustment. */
export class StepAdjustmentValidator {
  rules: StepAdjustmentRule[];

  constructor(rules: StepAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: StepAdjustment): string[] {
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

  requireValid(item: StepAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepAdjustment[]): Map<string, string[]> {
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

export function defaultStepAdjustmentValidator(): StepAdjustmentValidator {
  return new StepAdjustmentValidator(
    [
      new StepAdjustmentCountryLengthRule(86400),
      new StepAdjustmentRequiredCountryRule("step adjustment needs an entry"),
      new StepAdjustmentMinimumRangeRule(4.9, 1681.7),
      new StepAdjustmentTitleLengthRule(1000),
    ],
  );
}
