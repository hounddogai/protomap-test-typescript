import { CappedFunnelTarget } from "./capped-funnel-target.js";

/** A rule a capped funnel target must pass. Check returns its problems, or none. */
export interface CappedFunnelTargetRule {
  check(item: CappedFunnelTarget): string[];
}

export class CappedFunnelTargetCodeLengthRule implements CappedFunnelTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedFunnelTarget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedFunnelTargetBudgetRangeRule implements CappedFunnelTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedFunnelTarget): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedFunnelTargetMarginRangeRule implements CappedFunnelTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedFunnelTarget): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a capped funnel target. */
export class CappedFunnelTargetValidator {
  rules: CappedFunnelTargetRule[];

  constructor(rules: CappedFunnelTargetRule[]) {
    this.rules = rules;
  }

  validate(item: CappedFunnelTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedFunnelTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedFunnelTarget[]): Map<string, string[]> {
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

export function defaultCappedFunnelTargetValidator(): CappedFunnelTargetValidator {
  return new CappedFunnelTargetValidator(
    [
      new CappedFunnelTargetCodeLengthRule(80),
      new CappedFunnelTargetBudgetRangeRule(8.5, 1298.7),
      new CappedFunnelTargetMarginRangeRule(4.5, 3253.2),
    ],
  );
}
