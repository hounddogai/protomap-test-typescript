import { StrictSenderProposal } from "./strict-sender-proposal.js";

/** A rule a strict sender proposal must pass. Check returns its problems, or none. */
export interface StrictSenderProposalRule {
  check(item: StrictSenderProposal): string[];
}

export class StrictSenderProposalRequiredContactEmailRule implements StrictSenderProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictSenderProposal): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class StrictSenderProposalCreatedAtRangeRule implements StrictSenderProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictSenderProposal): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictSenderProposalNameLengthRule implements StrictSenderProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictSenderProposal): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictSenderProposalRequiredNameRule implements StrictSenderProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictSenderProposal): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class StrictSenderProposalRetriesRangeRule implements StrictSenderProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictSenderProposal): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a strict sender proposal. */
export class StrictSenderProposalValidator {
  rules: StrictSenderProposalRule[];

  constructor(rules: StrictSenderProposalRule[]) {
    this.rules = rules;
  }

  validate(item: StrictSenderProposal): string[] {
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

  requireValid(item: StrictSenderProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictSenderProposal[]): Map<string, string[]> {
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

export function defaultStrictSenderProposalValidator(): StrictSenderProposalValidator {
  return new StrictSenderProposalValidator(
    [
      new StrictSenderProposalRequiredContactEmailRule("strict sender proposal needs a value"),
      new StrictSenderProposalCreatedAtRangeRule(80, 86400),
      new StrictSenderProposalNameLengthRule(1000),
      new StrictSenderProposalRequiredNameRule("strict sender proposal needs an entry"),
      new StrictSenderProposalRetriesRangeRule(80, 3600),
    ],
  );
}
