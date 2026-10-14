import * as text from "../../../../kit/text.js";
import { DefaultPreferencePolicy } from "./default-preference-policy.js";

/** A rule a default preference policy must pass. Check returns its problems, or none. */
export interface DefaultPreferencePolicyRule {
  check(item: DefaultPreferencePolicy): string[];
}

export class DefaultPreferencePolicyChecksumLengthRule implements DefaultPreferencePolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPreferencePolicy): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultPreferencePolicyRequiredTitleRule implements DefaultPreferencePolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPreferencePolicy): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPreferencePolicyRequiredChecksumRule implements DefaultPreferencePolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPreferencePolicy): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPreferencePolicyAllowedChecksumRule implements DefaultPreferencePolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultPreferencePolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is expired`];
    return [];
  }
}

/** Runs every rule of a default preference policy. */
export class DefaultPreferencePolicyValidator {
  rules: DefaultPreferencePolicyRule[];

  constructor(rules: DefaultPreferencePolicyRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultPreferencePolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultPreferencePolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultPreferencePolicy[]): Map<string, string[]> {
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

export function defaultDefaultPreferencePolicyValidator(): DefaultPreferencePolicyValidator {
  return new DefaultPreferencePolicyValidator(
    [
      new DefaultPreferencePolicyChecksumLengthRule(32),
      new DefaultPreferencePolicyRequiredTitleRule("default preference policy needs this field"),
      new DefaultPreferencePolicyRequiredChecksumRule("default preference policy needs a value"),
      new DefaultPreferencePolicyAllowedChecksumRule(["scheduled"]),
    ],
  );
}
