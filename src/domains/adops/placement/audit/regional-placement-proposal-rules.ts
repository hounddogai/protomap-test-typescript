import { RegionalPlacementProposal } from "./regional-placement-proposal.js";

/** A rule a regional placement proposal must pass. Check returns its problems, or none. */
export interface RegionalPlacementProposalRule {
  check(item: RegionalPlacementProposal): string[];
}

export class RegionalPlacementProposalUnitLengthRule implements RegionalPlacementProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalPlacementProposal): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalPlacementProposalCodeLengthRule implements RegionalPlacementProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalPlacementProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalPlacementProposalRequiredUtmSourceRule implements RegionalPlacementProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalPlacementProposal): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalPlacementProposalLabelLengthRule implements RegionalPlacementProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalPlacementProposal): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalPlacementProposalBudgetRangeRule implements RegionalPlacementProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalPlacementProposal): string[] {
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

export class RegionalPlacementProposalRequiredUnitRule implements RegionalPlacementProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalPlacementProposal): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional placement proposal. */
export class RegionalPlacementProposalValidator {
  rules: RegionalPlacementProposalRule[];

  constructor(rules: RegionalPlacementProposalRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalPlacementProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalPlacementProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalPlacementProposal[]): Map<string, string[]> {
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

export function defaultRegionalPlacementProposalValidator(): RegionalPlacementProposalValidator {
  return new RegionalPlacementProposalValidator(
    [
      new RegionalPlacementProposalUnitLengthRule(64),
      new RegionalPlacementProposalCodeLengthRule(3600),
      new RegionalPlacementProposalRequiredUtmSourceRule("regional placement proposal needs an entry"),
      new RegionalPlacementProposalLabelLengthRule(86400),
      new RegionalPlacementProposalBudgetRangeRule(1.6, 1798.9),
      new RegionalPlacementProposalRequiredUnitRule("regional placement proposal needs this field"),
    ],
  );
}
