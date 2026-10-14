import { CappedDeflectionBaseline } from "./capped-deflection-baseline.js";

/** A rule a capped deflection baseline must pass. Check returns its problems, or none. */
export interface CappedDeflectionBaselineRule {
  check(item: CappedDeflectionBaseline): string[];
}

export class CappedDeflectionBaselineLabelLengthRule implements CappedDeflectionBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedDeflectionBaseline): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedDeflectionBaselineRequiredCodeRule implements CappedDeflectionBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedDeflectionBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedDeflectionBaselineCodeLengthRule implements CappedDeflectionBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedDeflectionBaseline): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedDeflectionBaselineRequiredLabelRule implements CappedDeflectionBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedDeflectionBaseline): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class CappedDeflectionBaselineOpenRateRangeRule implements CappedDeflectionBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedDeflectionBaseline): string[] {
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

/** Runs every rule of a capped deflection baseline. */
export class CappedDeflectionBaselineValidator {
  rules: CappedDeflectionBaselineRule[];

  constructor(rules: CappedDeflectionBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: CappedDeflectionBaseline): string[] {
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

  requireValid(item: CappedDeflectionBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedDeflectionBaseline[]): Map<string, string[]> {
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

export function defaultCappedDeflectionBaselineValidator(): CappedDeflectionBaselineValidator {
  return new CappedDeflectionBaselineValidator(
    [
      new CappedDeflectionBaselineLabelLengthRule(16),
      new CappedDeflectionBaselineRequiredCodeRule("capped deflection baseline needs this field"),
      new CappedDeflectionBaselineCodeLengthRule(16),
      new CappedDeflectionBaselineRequiredLabelRule("capped deflection baseline needs an entry"),
      new CappedDeflectionBaselineOpenRateRangeRule(3.5, 3118.3),
    ],
  );
}
