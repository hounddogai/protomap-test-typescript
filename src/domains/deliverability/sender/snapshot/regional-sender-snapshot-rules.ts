import * as text from "../../../../kit/text.js";
import { RegionalSenderSnapshot } from "./regional-sender-snapshot.js";

/** A rule a regional sender snapshot must pass. Check returns its problems, or none. */
export interface RegionalSenderSnapshotRule {
  check(item: RegionalSenderSnapshot): string[];
}

export class RegionalSenderSnapshotAllowedRegionRule implements RegionalSenderSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalSenderSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.region))) return [`region ${item.region} is below minimum`];
    return [];
  }
}

export class RegionalSenderSnapshotVersionRangeRule implements RegionalSenderSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalSenderSnapshot): string[] {
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

export class RegionalSenderSnapshotReviewerLengthRule implements RegionalSenderSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalSenderSnapshot): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalSenderSnapshotRequiredReviewerRule implements RegionalSenderSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalSenderSnapshot): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalSenderSnapshotRequiredLabelRule implements RegionalSenderSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalSenderSnapshot): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional sender snapshot. */
export class RegionalSenderSnapshotValidator {
  rules: RegionalSenderSnapshotRule[];

  constructor(rules: RegionalSenderSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalSenderSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalSenderSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalSenderSnapshot[]): Map<string, string[]> {
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

export function defaultRegionalSenderSnapshotValidator(): RegionalSenderSnapshotValidator {
  return new RegionalSenderSnapshotValidator(
    [
      new RegionalSenderSnapshotAllowedRegionRule(["pending"]),
      new RegionalSenderSnapshotVersionRangeRule(120, 255),
      new RegionalSenderSnapshotReviewerLengthRule(16),
      new RegionalSenderSnapshotRequiredReviewerRule("regional sender snapshot needs an entry"),
      new RegionalSenderSnapshotRequiredLabelRule("regional sender snapshot needs a value"),
    ],
  );
}
