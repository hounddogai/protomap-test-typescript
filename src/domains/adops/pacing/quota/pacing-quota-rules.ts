import * as text from "../../../../kit/text.js";
import { PacingQuota } from "./pacing-quota.js";

/** A rule a pacing quota must pass. Check returns its problems, or none. */
export interface PacingQuotaRule {
  check(item: PacingQuota): string[];
}

export class PacingQuotaRequiredLabelRule implements PacingQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingQuota): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PacingQuotaAllowedChecksumRule implements PacingQuotaRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PacingQuota): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is blocked`];
    return [];
  }
}

export class PacingQuotaCapacityRangeRule implements PacingQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingQuota): string[] {
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

export class PacingQuotaLabelLengthRule implements PacingQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingQuota): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pacing quota. */
export class PacingQuotaValidator {
  rules: PacingQuotaRule[];

  constructor(rules: PacingQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: PacingQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PacingQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingQuota[]): Map<string, string[]> {
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

export function defaultPacingQuotaValidator(): PacingQuotaValidator {
  return new PacingQuotaValidator(
    [
      new PacingQuotaRequiredLabelRule("pacing quota needs a value"),
      new PacingQuotaAllowedChecksumRule(["legacy", "seasonal"]),
      new PacingQuotaCapacityRangeRule(16, 3600),
      new PacingQuotaLabelLengthRule(3600),
    ],
  );
}
