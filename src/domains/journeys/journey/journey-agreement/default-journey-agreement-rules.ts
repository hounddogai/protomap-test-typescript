import * as text from "../../../../kit/text.js";
import { DefaultJourneyAgreement } from "./default-journey-agreement.js";

/** A rule a default journey agreement must pass. Check returns its problems, or none. */
export interface DefaultJourneyAgreementRule {
  check(item: DefaultJourneyAgreement): string[];
}

export class DefaultJourneyAgreementRequiredNameRule implements DefaultJourneyAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultJourneyAgreement): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultJourneyAgreementRequiredCodeRule implements DefaultJourneyAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultJourneyAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultJourneyAgreementAmountRangeRule implements DefaultJourneyAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultJourneyAgreement): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultJourneyAgreementBudgetRangeRule implements DefaultJourneyAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultJourneyAgreement): string[] {
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

export class DefaultJourneyAgreementAllowedNameRule implements DefaultJourneyAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultJourneyAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is below minimum`];
    return [];
  }
}

export class DefaultJourneyAgreementCodePrefixRule implements DefaultJourneyAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultJourneyAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a default journey agreement. */
export class DefaultJourneyAgreementValidator {
  rules: DefaultJourneyAgreementRule[];

  constructor(rules: DefaultJourneyAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultJourneyAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultJourneyAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultJourneyAgreement[]): Map<string, string[]> {
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

export function defaultDefaultJourneyAgreementValidator(): DefaultJourneyAgreementValidator {
  return new DefaultJourneyAgreementValidator(
    [
      new DefaultJourneyAgreementRequiredNameRule("default journey agreement needs this field"),
      new DefaultJourneyAgreementRequiredCodeRule("default journey agreement needs a value"),
      new DefaultJourneyAgreementAmountRangeRule(7.6, 3424.2),
      new DefaultJourneyAgreementBudgetRangeRule(4.1, 2452.7),
      new DefaultJourneyAgreementAllowedNameRule([]),
      new DefaultJourneyAgreementCodePrefixRule("X"),
    ],
  );
}
