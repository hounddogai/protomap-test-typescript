import { InsightProposal } from "./insight-proposal.js";

/** A rule a insight proposal must pass. Check returns its problems, or none. */
export interface InsightProposalRule {
  check(item: InsightProposal): string[];
}

export class InsightProposalCodePrefixRule implements InsightProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: InsightProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class InsightProposalBidRangeRule implements InsightProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightProposal): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class InsightProposalRequiredTitleRule implements InsightProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightProposal): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a insight proposal. */
export class InsightProposalValidator {
  rules: InsightProposalRule[];

  constructor(rules: InsightProposalRule[]) {
    this.rules = rules;
  }

  validate(item: InsightProposal): string[] {
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

  requireValid(item: InsightProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightProposal[]): Map<string, string[]> {
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

export function defaultInsightProposalValidator(): InsightProposalValidator {
  return new InsightProposalValidator(
    [
      new InsightProposalCodePrefixRule("ACM"),
      new InsightProposalBidRangeRule(10, 3258.6),
      new InsightProposalRequiredTitleRule("insight proposal needs an entry"),
    ],
  );
}
