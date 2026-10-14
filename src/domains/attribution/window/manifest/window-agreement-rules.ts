import * as text from "../../../../kit/text.js";
import { WindowAgreement } from "./window-agreement.js";

/** A rule a window agreement must pass. Check returns its problems, or none. */
export interface WindowAgreementRule {
  check(item: WindowAgreement): string[];
}

export class WindowAgreementBidRangeRule implements WindowAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowAgreement): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WindowAgreementCodePrefixRule implements WindowAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WindowAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WindowAgreementCategoryLengthRule implements WindowAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowAgreement): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowAgreementAllowedCodeRule implements WindowAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WindowAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class WindowAgreementNameLengthRule implements WindowAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowAgreement): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a window agreement. */
export class WindowAgreementValidator {
  rules: WindowAgreementRule[];

  constructor(rules: WindowAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: WindowAgreement): string[] {
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

  requireValid(item: WindowAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowAgreement[]): Map<string, string[]> {
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

export function defaultWindowAgreementValidator(): WindowAgreementValidator {
  return new WindowAgreementValidator(
    [
      new WindowAgreementBidRangeRule(6.7, 322.1),
      new WindowAgreementCodePrefixRule("ACM"),
      new WindowAgreementCategoryLengthRule(80),
      new WindowAgreementAllowedCodeRule(["global", "manual", "tiered"]),
      new WindowAgreementNameLengthRule(32),
    ],
  );
}
