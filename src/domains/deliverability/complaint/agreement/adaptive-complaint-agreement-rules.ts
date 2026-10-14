import { AdaptiveComplaintAgreement } from "./adaptive-complaint-agreement.js";

/** A rule a adaptive complaint agreement must pass. Check returns its problems, or none. */
export interface AdaptiveComplaintAgreementRule {
  check(item: AdaptiveComplaintAgreement): string[];
}

export class AdaptiveComplaintAgreementNameLengthRule implements AdaptiveComplaintAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveComplaintAgreement): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveComplaintAgreementPinnedGuardRule implements AdaptiveComplaintAgreementRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: AdaptiveComplaintAgreement): string[] {
    if (item.pinned && item.margin > this.limit) return [`margin ${item.margin} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class AdaptiveComplaintAgreementThresholdRangeRule implements AdaptiveComplaintAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveComplaintAgreement): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a adaptive complaint agreement. */
export class AdaptiveComplaintAgreementValidator {
  rules: AdaptiveComplaintAgreementRule[];

  constructor(rules: AdaptiveComplaintAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveComplaintAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveComplaintAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveComplaintAgreement[]): Map<string, string[]> {
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

export function defaultAdaptiveComplaintAgreementValidator(): AdaptiveComplaintAgreementValidator {
  return new AdaptiveComplaintAgreementValidator(
    [
      new AdaptiveComplaintAgreementNameLengthRule(255),
      new AdaptiveComplaintAgreementPinnedGuardRule(0.2),
      new AdaptiveComplaintAgreementThresholdRangeRule(8.6, 2973.2),
    ],
  );
}
