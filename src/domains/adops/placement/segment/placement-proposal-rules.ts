import { PlacementProposal } from "./placement-proposal.js";

/** A rule a placement proposal must pass. Check returns its problems, or none. */
export interface PlacementProposalRule {
  check(item: PlacementProposal): string[];
}

export class PlacementProposalCodeLengthRule implements PlacementProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementProposalCapacityRangeRule implements PlacementProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementProposal): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PlacementProposalOpenRateRangeRule implements PlacementProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementProposal): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a placement proposal. */
export class PlacementProposalValidator {
  rules: PlacementProposalRule[];

  constructor(rules: PlacementProposalRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementProposal): string[] {
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

  requireValid(item: PlacementProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementProposal[]): Map<string, string[]> {
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

export function defaultPlacementProposalValidator(): PlacementProposalValidator {
  return new PlacementProposalValidator(
    [
      new PlacementProposalCodeLengthRule(86400),
      new PlacementProposalCapacityRangeRule(16, 32),
      new PlacementProposalOpenRateRangeRule(5.6, 4913.3),
    ],
  );
}
