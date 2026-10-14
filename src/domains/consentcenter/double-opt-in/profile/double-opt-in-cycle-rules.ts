import { DoubleOptInCycle } from "./double-opt-in-cycle.js";

/** A rule a double opt in cycle must pass. Check returns its problems, or none. */
export interface DoubleOptInCycleRule {
  check(item: DoubleOptInCycle): string[];
}

export class DoubleOptInCycleExternalRefLengthRule implements DoubleOptInCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInCycle): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DoubleOptInCycleCreatedAtRangeRule implements DoubleOptInCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInCycle): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DoubleOptInCycleRequiredCodeRule implements DoubleOptInCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInCycleAmountRangeRule implements DoubleOptInCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInCycle): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DoubleOptInCycleOpenRateRangeRule implements DoubleOptInCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInCycle): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DoubleOptInCycleRequiredExternalRefRule implements DoubleOptInCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInCycle): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a double opt in cycle. */
export class DoubleOptInCycleValidator {
  rules: DoubleOptInCycleRule[];

  constructor(rules: DoubleOptInCycleRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInCycle): string[] {
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

  requireValid(item: DoubleOptInCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInCycle[]): Map<string, string[]> {
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

export function defaultDoubleOptInCycleValidator(): DoubleOptInCycleValidator {
  return new DoubleOptInCycleValidator(
    [
      new DoubleOptInCycleExternalRefLengthRule(255),
      new DoubleOptInCycleCreatedAtRangeRule(16, 1000),
      new DoubleOptInCycleRequiredCodeRule("double opt in cycle needs a value"),
      new DoubleOptInCycleAmountRangeRule(6.7, 4318.7),
      new DoubleOptInCycleOpenRateRangeRule(6, 2470.1),
      new DoubleOptInCycleRequiredExternalRefRule("double opt in cycle needs this field"),
    ],
  );
}
