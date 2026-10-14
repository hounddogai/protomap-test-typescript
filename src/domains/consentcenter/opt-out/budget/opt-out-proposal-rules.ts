import { OptOutProposal } from "./opt-out-proposal.js";

/** A rule a opt out proposal must pass. Check returns its problems, or none. */
export interface OptOutProposalRule {
  check(item: OptOutProposal): string[];
}

export class OptOutProposalEndsAtRangeRule implements OptOutProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: OptOutProposal): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class OptOutProposalRequiredCodeRule implements OptOutProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutProposal): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutProposalCodePrefixRule implements OptOutProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: OptOutProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a opt out proposal. */
export class OptOutProposalValidator {
  rules: OptOutProposalRule[];

  constructor(rules: OptOutProposalRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: OptOutProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutProposal[]): Map<string, string[]> {
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

export function defaultOptOutProposalValidator(): OptOutProposalValidator {
  return new OptOutProposalValidator(
    [
      new OptOutProposalEndsAtRangeRule(64, 3600),
      new OptOutProposalRequiredCodeRule("opt out proposal needs this field"),
      new OptOutProposalCodePrefixRule("X"),
    ],
  );
}
