import { StrictCreditEntry } from "./strict-credit-entry.js";

/** A rule a strict credit entry must pass. Check returns its problems, or none. */
export interface StrictCreditEntryRule {
  check(item: StrictCreditEntry): string[];
}

export class StrictCreditEntryRequiredCurrencyRule implements StrictCreditEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictCreditEntry): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class StrictCreditEntryCodeLengthRule implements StrictCreditEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictCreditEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictCreditEntryRequiredCodeRule implements StrictCreditEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictCreditEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict credit entry. */
export class StrictCreditEntryValidator {
  rules: StrictCreditEntryRule[];

  constructor(rules: StrictCreditEntryRule[]) {
    this.rules = rules;
  }

  validate(item: StrictCreditEntry): string[] {
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

  requireValid(item: StrictCreditEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictCreditEntry[]): Map<string, string[]> {
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

export function defaultStrictCreditEntryValidator(): StrictCreditEntryValidator {
  return new StrictCreditEntryValidator(
    [
      new StrictCreditEntryRequiredCurrencyRule("strict credit entry needs this field"),
      new StrictCreditEntryCodeLengthRule(86400),
      new StrictCreditEntryRequiredCodeRule("strict credit entry needs this field"),
    ],
  );
}
