import { AdaptiveCsatTarget } from "./adaptive-csat-target.js";

/** A rule a adaptive csat target must pass. Check returns its problems, or none. */
export interface AdaptiveCsatTargetRule {
  check(item: AdaptiveCsatTarget): string[];
}

export class AdaptiveCsatTargetCreatedAtRangeRule implements AdaptiveCsatTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveCsatTarget): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveCsatTargetVersionRangeRule implements AdaptiveCsatTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveCsatTarget): string[] {
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

export class AdaptiveCsatTargetLimitRangeRule implements AdaptiveCsatTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveCsatTarget): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveCsatTargetRatioRangeRule implements AdaptiveCsatTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveCsatTarget): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a adaptive csat target. */
export class AdaptiveCsatTargetValidator {
  rules: AdaptiveCsatTargetRule[];

  constructor(rules: AdaptiveCsatTargetRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveCsatTarget): string[] {
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

  requireValid(item: AdaptiveCsatTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveCsatTarget[]): Map<string, string[]> {
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

export function defaultAdaptiveCsatTargetValidator(): AdaptiveCsatTargetValidator {
  return new AdaptiveCsatTargetValidator(
    [
      new AdaptiveCsatTargetCreatedAtRangeRule(3600, 3600),
      new AdaptiveCsatTargetVersionRangeRule(32, 64),
      new AdaptiveCsatTargetLimitRangeRule(86400, 86400),
      new AdaptiveCsatTargetRatioRangeRule(6.7, 2680.4),
    ],
  );
}
