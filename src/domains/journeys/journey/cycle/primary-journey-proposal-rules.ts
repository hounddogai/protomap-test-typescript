import { PrimaryJourneyProposal } from "./primary-journey-proposal.js";

/** A rule a primary journey proposal must pass. Check returns its problems, or none. */
export interface PrimaryJourneyProposalRule {
  check(item: PrimaryJourneyProposal): string[];
}

export class PrimaryJourneyProposalRegionLengthRule implements PrimaryJourneyProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryJourneyProposal): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryJourneyProposalRequiredCodeRule implements PrimaryJourneyProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryJourneyProposal): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryJourneyProposalSourceLengthRule implements PrimaryJourneyProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryJourneyProposal): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryJourneyProposalNameLengthRule implements PrimaryJourneyProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryJourneyProposal): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary journey proposal. */
export class PrimaryJourneyProposalValidator {
  rules: PrimaryJourneyProposalRule[];

  constructor(rules: PrimaryJourneyProposalRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryJourneyProposal): string[] {
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

  requireValid(item: PrimaryJourneyProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryJourneyProposal[]): Map<string, string[]> {
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

export function defaultPrimaryJourneyProposalValidator(): PrimaryJourneyProposalValidator {
  return new PrimaryJourneyProposalValidator(
    [
      new PrimaryJourneyProposalRegionLengthRule(32),
      new PrimaryJourneyProposalRequiredCodeRule("primary journey proposal needs a value"),
      new PrimaryJourneyProposalSourceLengthRule(1000),
      new PrimaryJourneyProposalNameLengthRule(32),
    ],
  );
}
