import * as text from "../../../../kit/text.js";
import { EnrollmentSnapshot } from "./enrollment-snapshot.js";

/** A rule a enrollment snapshot must pass. Check returns its problems, or none. */
export interface EnrollmentSnapshotRule {
  check(item: EnrollmentSnapshot): string[];
}

export class EnrollmentSnapshotRequiredAudienceIdRule implements EnrollmentSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentSnapshot): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentSnapshotCodePrefixRule implements EnrollmentSnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EnrollmentSnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class EnrollmentSnapshotAllowedVariantRule implements EnrollmentSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: EnrollmentSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.variant))) return [`variant ${item.variant} is blocked`];
    return [];
  }
}

/** Runs every rule of a enrollment snapshot. */
export class EnrollmentSnapshotValidator {
  rules: EnrollmentSnapshotRule[];

  constructor(rules: EnrollmentSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentSnapshot): string[] {
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

  requireValid(item: EnrollmentSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentSnapshot[]): Map<string, string[]> {
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

export function defaultEnrollmentSnapshotValidator(): EnrollmentSnapshotValidator {
  return new EnrollmentSnapshotValidator(
    [
      new EnrollmentSnapshotRequiredAudienceIdRule("enrollment snapshot needs an entry"),
      new EnrollmentSnapshotCodePrefixRule("OPS"),
      new EnrollmentSnapshotAllowedVariantRule(["batched", "seasonal", "manual"]),
    ],
  );
}
