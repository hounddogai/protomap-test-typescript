import { CreditGroup } from "./credit-group.js";

/** A rule a credit group must pass. Check returns its problems, or none. */
export interface CreditGroupRule {
  check(item: CreditGroup): string[];
}

export class CreditGroupNameLengthRule implements CreditGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditGroup): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditGroupBudgetRangeRule implements CreditGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditGroup): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CreditGroupTimezoneLengthRule implements CreditGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditGroup): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditGroupCodePrefixRule implements CreditGroupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreditGroup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CreditGroupRequiredNameRule implements CreditGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditGroup): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CreditGroupRequiredTimezoneRule implements CreditGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditGroup): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a credit group. */
export class CreditGroupValidator {
  rules: CreditGroupRule[];

  constructor(rules: CreditGroupRule[]) {
    this.rules = rules;
  }

  validate(item: CreditGroup): string[] {
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

  requireValid(item: CreditGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditGroup[]): Map<string, string[]> {
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

export function defaultCreditGroupValidator(): CreditGroupValidator {
  return new CreditGroupValidator(
    [
      new CreditGroupNameLengthRule(32),
      new CreditGroupBudgetRangeRule(1.8, 3784.5),
      new CreditGroupTimezoneLengthRule(120),
      new CreditGroupCodePrefixRule("REF"),
      new CreditGroupRequiredNameRule("credit group needs this field"),
      new CreditGroupRequiredTimezoneRule("credit group needs this field"),
    ],
  );
}
