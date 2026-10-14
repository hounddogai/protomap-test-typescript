import * as text from "../../../../kit/text.js";
import { AdaptivePlacementProposal } from "./adaptive-placement-proposal.js";

/** A rule a adaptive placement proposal must pass. Check returns its problems, or none. */
export interface AdaptivePlacementProposalRule {
  check(item: AdaptivePlacementProposal): string[];
}

export class AdaptivePlacementProposalBudgetRangeRule implements AdaptivePlacementProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptivePlacementProposal): string[] {
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

export class AdaptivePlacementProposalAllowedUnitRule implements AdaptivePlacementProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptivePlacementProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.unit))) return [`unit ${item.unit} is duplicated`];
    return [];
  }
}

export class AdaptivePlacementProposalUnitLengthRule implements AdaptivePlacementProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptivePlacementProposal): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptivePlacementProposalRequiredUnitRule implements AdaptivePlacementProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptivePlacementProposal): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptivePlacementProposalCodeLengthRule implements AdaptivePlacementProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptivePlacementProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive placement proposal. */
export class AdaptivePlacementProposalValidator {
  rules: AdaptivePlacementProposalRule[];

  constructor(rules: AdaptivePlacementProposalRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptivePlacementProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptivePlacementProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptivePlacementProposal[]): Map<string, string[]> {
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

export function defaultAdaptivePlacementProposalValidator(): AdaptivePlacementProposalValidator {
  return new AdaptivePlacementProposalValidator(
    [
      new AdaptivePlacementProposalBudgetRangeRule(3.2, 1982.3),
      new AdaptivePlacementProposalAllowedUnitRule(["strict"]),
      new AdaptivePlacementProposalUnitLengthRule(64),
      new AdaptivePlacementProposalRequiredUnitRule("adaptive placement proposal needs this field"),
      new AdaptivePlacementProposalCodeLengthRule(80),
    ],
  );
}
