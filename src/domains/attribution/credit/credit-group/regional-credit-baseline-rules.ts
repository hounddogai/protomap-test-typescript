import * as text from "../../../../kit/text.js";
import { RegionalCreditBaseline } from "./regional-credit-baseline.js";

/** A rule a regional credit baseline must pass. Check returns its problems, or none. */
export interface RegionalCreditBaselineRule {
  check(item: RegionalCreditBaseline): string[];
}

export class RegionalCreditBaselineRequiredCodeRule implements RegionalCreditBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalCreditBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalCreditBaselineOwnerIdLengthRule implements RegionalCreditBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalCreditBaseline): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalCreditBaselineRequiredLocaleRule implements RegionalCreditBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalCreditBaseline): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalCreditBaselineLabelLengthRule implements RegionalCreditBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalCreditBaseline): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalCreditBaselineAllowedCodeRule implements RegionalCreditBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalCreditBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

/** Runs every rule of a regional credit baseline. */
export class RegionalCreditBaselineValidator {
  rules: RegionalCreditBaselineRule[];

  constructor(rules: RegionalCreditBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalCreditBaseline): string[] {
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

  requireValid(item: RegionalCreditBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalCreditBaseline[]): Map<string, string[]> {
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

export function defaultRegionalCreditBaselineValidator(): RegionalCreditBaselineValidator {
  return new RegionalCreditBaselineValidator(
    [
      new RegionalCreditBaselineRequiredCodeRule("regional credit baseline needs a value"),
      new RegionalCreditBaselineOwnerIdLengthRule(32),
      new RegionalCreditBaselineRequiredLocaleRule("regional credit baseline needs this field"),
      new RegionalCreditBaselineLabelLengthRule(3600),
      new RegionalCreditBaselineAllowedCodeRule([]),
    ],
  );
}
