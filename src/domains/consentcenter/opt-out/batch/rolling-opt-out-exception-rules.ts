import * as text from "../../../../kit/text.js";
import { RollingOptOutException } from "./rolling-opt-out-exception.js";

/** A rule a rolling opt out exception must pass. Check returns its problems, or none. */
export interface RollingOptOutExceptionRule {
  check(item: RollingOptOutException): string[];
}

export class RollingOptOutExceptionRequiredTitleRule implements RollingOptOutExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingOptOutException): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RollingOptOutExceptionAllowedExternalRefRule implements RollingOptOutExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingOptOutException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is above maximum`];
    return [];
  }
}

export class RollingOptOutExceptionCodePrefixRule implements RollingOptOutExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingOptOutException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingOptOutExceptionTitleLengthRule implements RollingOptOutExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingOptOutException): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingOptOutExceptionRequiredCodeRule implements RollingOptOutExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingOptOutException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingOptOutExceptionRequiredPhoneRule implements RollingOptOutExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingOptOutException): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling opt out exception. */
export class RollingOptOutExceptionValidator {
  rules: RollingOptOutExceptionRule[];

  constructor(rules: RollingOptOutExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: RollingOptOutException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingOptOutException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingOptOutException[]): Map<string, string[]> {
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

export function defaultRollingOptOutExceptionValidator(): RollingOptOutExceptionValidator {
  return new RollingOptOutExceptionValidator(
    [
      new RollingOptOutExceptionRequiredTitleRule("rolling opt out exception needs an entry"),
      new RollingOptOutExceptionAllowedExternalRefRule(["capped", "scheduled"]),
      new RollingOptOutExceptionCodePrefixRule("ACM"),
      new RollingOptOutExceptionTitleLengthRule(64),
      new RollingOptOutExceptionRequiredCodeRule("rolling opt out exception needs a value"),
      new RollingOptOutExceptionRequiredPhoneRule("rolling opt out exception needs an entry"),
    ],
  );
}
