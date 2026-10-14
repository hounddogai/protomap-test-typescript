import * as text from "../../../../kit/text.js";
import { EnrollmentDraft } from "./enrollment-draft.js";

/** A rule a enrollment draft must pass. Check returns its problems, or none. */
export interface EnrollmentDraftRule {
  check(item: EnrollmentDraft): string[];
}

export class EnrollmentDraftSegmentLengthRule implements EnrollmentDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentDraft): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentDraftMaximumRangeRule implements EnrollmentDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentDraft): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class EnrollmentDraftRequiredLabelRule implements EnrollmentDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentDraft): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentDraftCodePrefixRule implements EnrollmentDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EnrollmentDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class EnrollmentDraftAllowedSegmentRule implements EnrollmentDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: EnrollmentDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is below minimum`];
    return [];
  }
}

/** Runs every rule of a enrollment draft. */
export class EnrollmentDraftValidator {
  rules: EnrollmentDraftRule[];

  constructor(rules: EnrollmentDraftRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentDraft): string[] {
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

  requireValid(item: EnrollmentDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentDraft[]): Map<string, string[]> {
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

export function defaultEnrollmentDraftValidator(): EnrollmentDraftValidator {
  return new EnrollmentDraftValidator(
    [
      new EnrollmentDraftSegmentLengthRule(80),
      new EnrollmentDraftMaximumRangeRule(2.2, 2038),
      new EnrollmentDraftRequiredLabelRule("enrollment draft needs this field"),
      new EnrollmentDraftCodePrefixRule("Q"),
      new EnrollmentDraftAllowedSegmentRule(["tiered", "strict"]),
    ],
  );
}
