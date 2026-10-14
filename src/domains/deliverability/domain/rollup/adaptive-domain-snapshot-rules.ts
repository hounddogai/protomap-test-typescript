import { AdaptiveDomainSnapshot } from "./adaptive-domain-snapshot.js";

/** A rule a adaptive domain snapshot must pass. Check returns its problems, or none. */
export interface AdaptiveDomainSnapshotRule {
  check(item: AdaptiveDomainSnapshot): string[];
}

export class AdaptiveDomainSnapshotCodeLengthRule implements AdaptiveDomainSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveDomainSnapshot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveDomainSnapshotRequiredCodeRule implements AdaptiveDomainSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveDomainSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveDomainSnapshotCapacityRangeRule implements AdaptiveDomainSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveDomainSnapshot): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a adaptive domain snapshot. */
export class AdaptiveDomainSnapshotValidator {
  rules: AdaptiveDomainSnapshotRule[];

  constructor(rules: AdaptiveDomainSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveDomainSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveDomainSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveDomainSnapshot[]): Map<string, string[]> {
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

export function defaultAdaptiveDomainSnapshotValidator(): AdaptiveDomainSnapshotValidator {
  return new AdaptiveDomainSnapshotValidator(
    [
      new AdaptiveDomainSnapshotCodeLengthRule(64),
      new AdaptiveDomainSnapshotRequiredCodeRule("adaptive domain snapshot needs a value"),
      new AdaptiveDomainSnapshotCapacityRangeRule(1000, 86400),
    ],
  );
}
