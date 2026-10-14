import { StrictPathProposal } from "./strict-path-proposal.js";

/** A rule a strict path proposal must pass. Check returns its problems, or none. */
export interface StrictPathProposalRule {
  check(item: StrictPathProposal): string[];
}

export class StrictPathProposalBatchSizeRangeRule implements StrictPathProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictPathProposal): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictPathProposalBudgetRangeRule implements StrictPathProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictPathProposal): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictPathProposalRequiredCodeRule implements StrictPathProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictPathProposal): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictPathProposalAudienceIdLengthRule implements StrictPathProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictPathProposal): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictPathProposalRateRangeRule implements StrictPathProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictPathProposal): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a strict path proposal. */
export class StrictPathProposalValidator {
  rules: StrictPathProposalRule[];

  constructor(rules: StrictPathProposalRule[]) {
    this.rules = rules;
  }

  validate(item: StrictPathProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictPathProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictPathProposal[]): Map<string, string[]> {
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

export function defaultStrictPathProposalValidator(): StrictPathProposalValidator {
  return new StrictPathProposalValidator(
    [
      new StrictPathProposalBatchSizeRangeRule(120, 255),
      new StrictPathProposalBudgetRangeRule(7.8, 4752.5),
      new StrictPathProposalRequiredCodeRule("strict path proposal needs a value"),
      new StrictPathProposalAudienceIdLengthRule(1000),
      new StrictPathProposalRateRangeRule(9.8, 1643.4),
    ],
  );
}
