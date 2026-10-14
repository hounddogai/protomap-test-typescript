import { TouchpointProposal } from "./touchpoint-proposal.js";

/** A rule a touchpoint proposal must pass. Check returns its problems, or none. */
export interface TouchpointProposalRule {
  check(item: TouchpointProposal): string[];
}

export class TouchpointProposalImpressionsRangeRule implements TouchpointProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TouchpointProposal): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TouchpointProposalCodePrefixRule implements TouchpointProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TouchpointProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TouchpointProposalRequiredChannelRule implements TouchpointProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointProposal): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a touchpoint proposal. */
export class TouchpointProposalValidator {
  rules: TouchpointProposalRule[];

  constructor(rules: TouchpointProposalRule[]) {
    this.rules = rules;
  }

  validate(item: TouchpointProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TouchpointProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TouchpointProposal[]): Map<string, string[]> {
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

export function defaultTouchpointProposalValidator(): TouchpointProposalValidator {
  return new TouchpointProposalValidator(
    [
      new TouchpointProposalImpressionsRangeRule(80, 255),
      new TouchpointProposalCodePrefixRule("X"),
      new TouchpointProposalRequiredChannelRule("touchpoint proposal needs an entry"),
    ],
  );
}
