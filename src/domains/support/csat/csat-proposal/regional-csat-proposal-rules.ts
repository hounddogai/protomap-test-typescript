import { RegionalCsatProposal } from "./regional-csat-proposal.js";

/** A rule a regional csat proposal must pass. Check returns its problems, or none. */
export interface RegionalCsatProposalRule {
  check(item: RegionalCsatProposal): string[];
}

export class RegionalCsatProposalCeilingRangeRule implements RegionalCsatProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalCsatProposal): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalCsatProposalDiscountRangeRule implements RegionalCsatProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalCsatProposal): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalCsatProposalLabelLengthRule implements RegionalCsatProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalCsatProposal): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalCsatProposalCodeLengthRule implements RegionalCsatProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalCsatProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalCsatProposalRequiredCountryRule implements RegionalCsatProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalCsatProposal): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalCsatProposalRequiredCurrencyRule implements RegionalCsatProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalCsatProposal): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional csat proposal. */
export class RegionalCsatProposalValidator {
  rules: RegionalCsatProposalRule[];

  constructor(rules: RegionalCsatProposalRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalCsatProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalCsatProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalCsatProposal[]): Map<string, string[]> {
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

export function defaultRegionalCsatProposalValidator(): RegionalCsatProposalValidator {
  return new RegionalCsatProposalValidator(
    [
      new RegionalCsatProposalCeilingRangeRule(9.5, 3245.1),
      new RegionalCsatProposalDiscountRangeRule(7.7, 4720),
      new RegionalCsatProposalLabelLengthRule(120),
      new RegionalCsatProposalCodeLengthRule(120),
      new RegionalCsatProposalRequiredCountryRule("regional csat proposal needs an entry"),
      new RegionalCsatProposalRequiredCurrencyRule("regional csat proposal needs a value"),
    ],
  );
}
