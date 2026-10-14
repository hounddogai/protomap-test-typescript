import { WeightedRedemptionProposal } from "./weighted-redemption-proposal.js";

/** A rule a weighted redemption proposal must pass. Check returns its problems, or none. */
export interface WeightedRedemptionProposalRule {
  check(item: WeightedRedemptionProposal): string[];
}

export class WeightedRedemptionProposalCodePrefixRule implements WeightedRedemptionProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedRedemptionProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedRedemptionProposalLabelLengthRule implements WeightedRedemptionProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedRedemptionProposal): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedRedemptionProposalCodeLengthRule implements WeightedRedemptionProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedRedemptionProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted redemption proposal. */
export class WeightedRedemptionProposalValidator {
  rules: WeightedRedemptionProposalRule[];

  constructor(rules: WeightedRedemptionProposalRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedRedemptionProposal): string[] {
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

  requireValid(item: WeightedRedemptionProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedRedemptionProposal[]): Map<string, string[]> {
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

export function defaultWeightedRedemptionProposalValidator(): WeightedRedemptionProposalValidator {
  return new WeightedRedemptionProposalValidator(
    [
      new WeightedRedemptionProposalCodePrefixRule("REF"),
      new WeightedRedemptionProposalLabelLengthRule(64),
      new WeightedRedemptionProposalCodeLengthRule(3600),
    ],
  );
}
