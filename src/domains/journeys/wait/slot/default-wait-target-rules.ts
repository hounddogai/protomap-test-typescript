import * as text from "../../../../kit/text.js";
import { DefaultWaitTarget } from "./default-wait-target.js";

/** A rule a default wait target must pass. Check returns its problems, or none. */
export interface DefaultWaitTargetRule {
  check(item: DefaultWaitTarget): string[];
}

export class DefaultWaitTargetCountryLengthRule implements DefaultWaitTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultWaitTarget): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultWaitTargetLabelLengthRule implements DefaultWaitTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultWaitTarget): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultWaitTargetCodePrefixRule implements DefaultWaitTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultWaitTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultWaitTargetAllowedCodeRule implements DefaultWaitTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultWaitTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

export class DefaultWaitTargetContactEmailLengthRule implements DefaultWaitTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultWaitTarget): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default wait target. */
export class DefaultWaitTargetValidator {
  rules: DefaultWaitTargetRule[];

  constructor(rules: DefaultWaitTargetRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultWaitTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultWaitTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultWaitTarget[]): Map<string, string[]> {
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

export function defaultDefaultWaitTargetValidator(): DefaultWaitTargetValidator {
  return new DefaultWaitTargetValidator(
    [
      new DefaultWaitTargetCountryLengthRule(1000),
      new DefaultWaitTargetLabelLengthRule(64),
      new DefaultWaitTargetCodePrefixRule("REF"),
      new DefaultWaitTargetAllowedCodeRule(["default"]),
      new DefaultWaitTargetContactEmailLengthRule(16),
    ],
  );
}
