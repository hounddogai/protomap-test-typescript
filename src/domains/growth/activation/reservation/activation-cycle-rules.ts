import { ActivationCycle } from "./activation-cycle.js";

/** A rule a activation cycle must pass. Check returns its problems, or none. */
export interface ActivationCycleRule {
  check(item: ActivationCycle): string[];
}

export class ActivationCycleCurrencyLengthRule implements ActivationCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationCycle): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationCycleVersionRangeRule implements ActivationCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationCycle): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ActivationCycleCodeLengthRule implements ActivationCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationCycle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a activation cycle. */
export class ActivationCycleValidator {
  rules: ActivationCycleRule[];

  constructor(rules: ActivationCycleRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationCycle): string[] {
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

  requireValid(item: ActivationCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationCycle[]): Map<string, string[]> {
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

export function defaultActivationCycleValidator(): ActivationCycleValidator {
  return new ActivationCycleValidator(
    [
      new ActivationCycleCurrencyLengthRule(120),
      new ActivationCycleVersionRangeRule(80, 1000),
      new ActivationCycleCodeLengthRule(64),
    ],
  );
}
