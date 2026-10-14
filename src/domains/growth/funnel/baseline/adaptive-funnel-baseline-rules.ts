import { AdaptiveFunnelBaseline } from "./adaptive-funnel-baseline.js";

/** A rule a adaptive funnel baseline must pass. Check returns its problems, or none. */
export interface AdaptiveFunnelBaselineRule {
  check(item: AdaptiveFunnelBaseline): string[];
}

export class AdaptiveFunnelBaselineTitleLengthRule implements AdaptiveFunnelBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveFunnelBaseline): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveFunnelBaselineRequiredOwnerIdRule implements AdaptiveFunnelBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveFunnelBaseline): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveFunnelBaselineRequiredTitleRule implements AdaptiveFunnelBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveFunnelBaseline): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveFunnelBaselineCeilingRangeRule implements AdaptiveFunnelBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveFunnelBaseline): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveFunnelBaselineBudgetRangeRule implements AdaptiveFunnelBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveFunnelBaseline): string[] {
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

/** Runs every rule of a adaptive funnel baseline. */
export class AdaptiveFunnelBaselineValidator {
  rules: AdaptiveFunnelBaselineRule[];

  constructor(rules: AdaptiveFunnelBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveFunnelBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveFunnelBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveFunnelBaseline[]): Map<string, string[]> {
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

export function defaultAdaptiveFunnelBaselineValidator(): AdaptiveFunnelBaselineValidator {
  return new AdaptiveFunnelBaselineValidator(
    [
      new AdaptiveFunnelBaselineTitleLengthRule(120),
      new AdaptiveFunnelBaselineRequiredOwnerIdRule("adaptive funnel baseline needs this field"),
      new AdaptiveFunnelBaselineRequiredTitleRule("adaptive funnel baseline needs this field"),
      new AdaptiveFunnelBaselineCeilingRangeRule(6.6, 75.5),
      new AdaptiveFunnelBaselineBudgetRangeRule(0.3, 127),
    ],
  );
}
