import * as text from "../../../../kit/text.js";
import { PrimaryPathDigest } from "./primary-path-digest.js";

/** A rule a primary path digest must pass. Check returns its problems, or none. */
export interface PrimaryPathDigestRule {
  check(item: PrimaryPathDigest): string[];
}

export class PrimaryPathDigestAllowedUtmSourceRule implements PrimaryPathDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryPathDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is expired`];
    return [];
  }
}

export class PrimaryPathDigestRequiredCodeRule implements PrimaryPathDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryPathDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryPathDigestRequiredLabelRule implements PrimaryPathDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryPathDigest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryPathDigestLabelLengthRule implements PrimaryPathDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryPathDigest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary path digest. */
export class PrimaryPathDigestValidator {
  rules: PrimaryPathDigestRule[];

  constructor(rules: PrimaryPathDigestRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryPathDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryPathDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryPathDigest[]): Map<string, string[]> {
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

export function defaultPrimaryPathDigestValidator(): PrimaryPathDigestValidator {
  return new PrimaryPathDigestValidator(
    [
      new PrimaryPathDigestAllowedUtmSourceRule(["tiered", "batched"]),
      new PrimaryPathDigestRequiredCodeRule("primary path digest needs a value"),
      new PrimaryPathDigestRequiredLabelRule("primary path digest needs a value"),
      new PrimaryPathDigestLabelLengthRule(80),
    ],
  );
}
