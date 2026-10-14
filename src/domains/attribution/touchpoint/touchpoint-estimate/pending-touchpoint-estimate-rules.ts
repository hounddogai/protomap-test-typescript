import { PendingTouchpointEstimate } from "./pending-touchpoint-estimate.js";

/** A rule a pending touchpoint estimate must pass. Check returns its problems, or none. */
export interface PendingTouchpointEstimateRule {
  check(item: PendingTouchpointEstimate): string[];
}

export class PendingTouchpointEstimateUpdatedAtRangeRule implements PendingTouchpointEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingTouchpointEstimate): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingTouchpointEstimateCodeLengthRule implements PendingTouchpointEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingTouchpointEstimate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingTouchpointEstimateExpiresAtRangeRule implements PendingTouchpointEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingTouchpointEstimate): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingTouchpointEstimateCohortLengthRule implements PendingTouchpointEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingTouchpointEstimate): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingTouchpointEstimateNameLengthRule implements PendingTouchpointEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingTouchpointEstimate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending touchpoint estimate. */
export class PendingTouchpointEstimateValidator {
  rules: PendingTouchpointEstimateRule[];

  constructor(rules: PendingTouchpointEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: PendingTouchpointEstimate): string[] {
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

  requireValid(item: PendingTouchpointEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingTouchpointEstimate[]): Map<string, string[]> {
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

export function defaultPendingTouchpointEstimateValidator(): PendingTouchpointEstimateValidator {
  return new PendingTouchpointEstimateValidator(
    [
      new PendingTouchpointEstimateUpdatedAtRangeRule(32, 3600),
      new PendingTouchpointEstimateCodeLengthRule(86400),
      new PendingTouchpointEstimateExpiresAtRangeRule(120, 1000),
      new PendingTouchpointEstimateCohortLengthRule(16),
      new PendingTouchpointEstimateNameLengthRule(80),
    ],
  );
}
