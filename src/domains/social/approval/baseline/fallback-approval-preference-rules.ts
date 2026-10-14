import * as text from "../../../../kit/text.js";
import { FallbackApprovalPreference } from "./fallback-approval-preference.js";

/** A rule a fallback approval preference must pass. Check returns its problems, or none. */
export interface FallbackApprovalPreferenceRule {
  check(item: FallbackApprovalPreference): string[];
}

export class FallbackApprovalPreferenceExpiresAtRangeRule implements FallbackApprovalPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackApprovalPreference): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackApprovalPreferenceRequiredSegmentRule implements FallbackApprovalPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackApprovalPreference): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackApprovalPreferenceAllowedSegmentRule implements FallbackApprovalPreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackApprovalPreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is stale`];
    return [];
  }
}

export class FallbackApprovalPreferenceApprovedGuardRule implements FallbackApprovalPreferenceRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FallbackApprovalPreference): string[] {
    if (item.approved && item.expiresAt > this.limit) return [`expires at ${item.expiresAt} exceeds ${this.limit} while approved`];
    return [];
  }
}

/** Runs every rule of a fallback approval preference. */
export class FallbackApprovalPreferenceValidator {
  rules: FallbackApprovalPreferenceRule[];

  constructor(rules: FallbackApprovalPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackApprovalPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackApprovalPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackApprovalPreference[]): Map<string, string[]> {
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

export function defaultFallbackApprovalPreferenceValidator(): FallbackApprovalPreferenceValidator {
  return new FallbackApprovalPreferenceValidator(
    [
      new FallbackApprovalPreferenceExpiresAtRangeRule(64, 120),
      new FallbackApprovalPreferenceRequiredSegmentRule("fallback approval preference needs a value"),
      new FallbackApprovalPreferenceAllowedSegmentRule(["capped", "seasonal"]),
      new FallbackApprovalPreferenceApprovedGuardRule(64),
    ],
  );
}
