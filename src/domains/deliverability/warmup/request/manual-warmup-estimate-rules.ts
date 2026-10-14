import { ManualWarmupEstimate } from "./manual-warmup-estimate.js";

/** A rule a manual warmup estimate must pass. Check returns its problems, or none. */
export interface ManualWarmupEstimateRule {
  check(item: ManualWarmupEstimate): string[];
}

export class ManualWarmupEstimateActiveGuardRule implements ManualWarmupEstimateRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ManualWarmupEstimate): string[] {
    if (item.active && item.ratio > this.limit) return [`ratio ${item.ratio} exceeds ${this.limit} while active`];
    return [];
  }
}

export class ManualWarmupEstimateRequiredExternalRefRule implements ManualWarmupEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualWarmupEstimate): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class ManualWarmupEstimateRatioRangeRule implements ManualWarmupEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualWarmupEstimate): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a manual warmup estimate. */
export class ManualWarmupEstimateValidator {
  rules: ManualWarmupEstimateRule[];

  constructor(rules: ManualWarmupEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: ManualWarmupEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualWarmupEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualWarmupEstimate[]): Map<string, string[]> {
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

export function defaultManualWarmupEstimateValidator(): ManualWarmupEstimateValidator {
  return new ManualWarmupEstimateValidator(
    [
      new ManualWarmupEstimateActiveGuardRule(0.7),
      new ManualWarmupEstimateRequiredExternalRefRule("manual warmup estimate needs a value"),
      new ManualWarmupEstimateRatioRangeRule(4, 4267),
    ],
  );
}
