import { RegionalActivationProposal } from "./regional-activation-proposal.js";

/** A rule a regional activation proposal must pass. Check returns its problems, or none. */
export interface RegionalActivationProposalRule {
  check(item: RegionalActivationProposal): string[];
}

export class RegionalActivationProposalRequiredExternalRefRule implements RegionalActivationProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalActivationProposal): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalActivationProposalExternalRefLengthRule implements RegionalActivationProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalActivationProposal): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalActivationProposalRequiredLabelRule implements RegionalActivationProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalActivationProposal): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalActivationProposalVariantLengthRule implements RegionalActivationProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalActivationProposal): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional activation proposal. */
export class RegionalActivationProposalValidator {
  rules: RegionalActivationProposalRule[];

  constructor(rules: RegionalActivationProposalRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalActivationProposal): string[] {
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

  requireValid(item: RegionalActivationProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalActivationProposal[]): Map<string, string[]> {
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

export function defaultRegionalActivationProposalValidator(): RegionalActivationProposalValidator {
  return new RegionalActivationProposalValidator(
    [
      new RegionalActivationProposalRequiredExternalRefRule("regional activation proposal needs a value"),
      new RegionalActivationProposalExternalRefLengthRule(255),
      new RegionalActivationProposalRequiredLabelRule("regional activation proposal needs a value"),
      new RegionalActivationProposalVariantLengthRule(255),
    ],
  );
}
