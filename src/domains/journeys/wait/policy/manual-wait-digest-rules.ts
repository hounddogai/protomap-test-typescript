import * as text from "../../../../kit/text.js";
import { ManualWaitDigest } from "./manual-wait-digest.js";

/** A rule a manual wait digest must pass. Check returns its problems, or none. */
export interface ManualWaitDigestRule {
  check(item: ManualWaitDigest): string[];
}

export class ManualWaitDigestAllowedLocaleRule implements ManualWaitDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualWaitDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is above maximum`];
    return [];
  }
}

export class ManualWaitDigestLabelLengthRule implements ManualWaitDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualWaitDigest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualWaitDigestRequiredLabelRule implements ManualWaitDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualWaitDigest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual wait digest. */
export class ManualWaitDigestValidator {
  rules: ManualWaitDigestRule[];

  constructor(rules: ManualWaitDigestRule[]) {
    this.rules = rules;
  }

  validate(item: ManualWaitDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualWaitDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualWaitDigest[]): Map<string, string[]> {
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

export function defaultManualWaitDigestValidator(): ManualWaitDigestValidator {
  return new ManualWaitDigestValidator(
    [
      new ManualWaitDigestAllowedLocaleRule(["strict", "scheduled", "primary"]),
      new ManualWaitDigestLabelLengthRule(3600),
      new ManualWaitDigestRequiredLabelRule("manual wait digest needs a value"),
    ],
  );
}
