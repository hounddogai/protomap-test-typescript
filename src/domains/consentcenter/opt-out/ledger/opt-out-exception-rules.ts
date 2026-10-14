import * as text from "../../../../kit/text.js";
import { OptOutException } from "./opt-out-exception.js";

/** A rule a opt out exception must pass. Check returns its problems, or none. */
export interface OptOutExceptionRule {
  check(item: OptOutException): string[];
}

export class OptOutExceptionRequiredSourceRule implements OptOutExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutException): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutExceptionAllowedCodeRule implements OptOutExceptionRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: OptOutException): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class OptOutExceptionEndsAtRangeRule implements OptOutExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: OptOutException): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class OptOutExceptionCodePrefixRule implements OptOutExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: OptOutException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class OptOutExceptionCodeLengthRule implements OptOutExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: OptOutException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a opt out exception. */
export class OptOutExceptionValidator {
  rules: OptOutExceptionRule[];

  constructor(rules: OptOutExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: OptOutException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutException[]): Map<string, string[]> {
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

export function defaultOptOutExceptionValidator(): OptOutExceptionValidator {
  return new OptOutExceptionValidator(
    [
      new OptOutExceptionRequiredSourceRule("opt out exception needs a value"),
      new OptOutExceptionAllowedCodeRule([]),
      new OptOutExceptionEndsAtRangeRule(120, 3600),
      new OptOutExceptionCodePrefixRule("REF"),
      new OptOutExceptionCodeLengthRule(86400),
    ],
  );
}
