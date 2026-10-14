import { PendingSubscriptionManifest } from "./pending-subscription-manifest.js";

/** A rule a pending subscription manifest must pass. Check returns its problems, or none. */
export interface PendingSubscriptionManifestRule {
  check(item: PendingSubscriptionManifest): string[];
}

export class PendingSubscriptionManifestWindowDaysRangeRule implements PendingSubscriptionManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingSubscriptionManifest): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingSubscriptionManifestCodeLengthRule implements PendingSubscriptionManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingSubscriptionManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingSubscriptionManifestApprovedGuardRule implements PendingSubscriptionManifestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PendingSubscriptionManifest): string[] {
    if (item.approved && item.windowDays > this.limit) return [`window days ${item.windowDays} exceeds ${this.limit} while approved`];
    return [];
  }
}

/** Runs every rule of a pending subscription manifest. */
export class PendingSubscriptionManifestValidator {
  rules: PendingSubscriptionManifestRule[];

  constructor(rules: PendingSubscriptionManifestRule[]) {
    this.rules = rules;
  }

  validate(item: PendingSubscriptionManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingSubscriptionManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingSubscriptionManifest[]): Map<string, string[]> {
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

export function defaultPendingSubscriptionManifestValidator(): PendingSubscriptionManifestValidator {
  return new PendingSubscriptionManifestValidator(
    [
      new PendingSubscriptionManifestWindowDaysRangeRule(32, 86400),
      new PendingSubscriptionManifestCodeLengthRule(80),
      new PendingSubscriptionManifestApprovedGuardRule(32),
    ],
  );
}
