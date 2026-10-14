import * as text from "../../../../kit/text.js";
import { DoubleOptInDigest } from "./double-opt-in-digest.js";

/** A rule a double opt in digest must pass. Check returns its problems, or none. */
export interface DoubleOptInDigestRule {
  check(item: DoubleOptInDigest): string[];
}

export class DoubleOptInDigestAllowedLabelRule implements DoubleOptInDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DoubleOptInDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is not allowed`];
    return [];
  }
}

export class DoubleOptInDigestCountryLengthRule implements DoubleOptInDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInDigest): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DoubleOptInDigestRequiredCodeRule implements DoubleOptInDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInDigestRequiredDescriptionRule implements DoubleOptInDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInDigest): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInDigestCodePrefixRule implements DoubleOptInDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DoubleOptInDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a double opt in digest. */
export class DoubleOptInDigestValidator {
  rules: DoubleOptInDigestRule[];

  constructor(rules: DoubleOptInDigestRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DoubleOptInDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInDigest[]): Map<string, string[]> {
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

export function defaultDoubleOptInDigestValidator(): DoubleOptInDigestValidator {
  return new DoubleOptInDigestValidator(
    [
      new DoubleOptInDigestAllowedLabelRule(["legacy"]),
      new DoubleOptInDigestCountryLengthRule(120),
      new DoubleOptInDigestRequiredCodeRule("double opt in digest needs a value"),
      new DoubleOptInDigestRequiredDescriptionRule("double opt in digest needs a value"),
      new DoubleOptInDigestCodePrefixRule("REF"),
    ],
  );
}
