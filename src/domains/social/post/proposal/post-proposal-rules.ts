import { PostProposal } from "./post-proposal.js";

/** A rule a post proposal must pass. Check returns its problems, or none. */
export interface PostProposalRule {
  check(item: PostProposal): string[];
}

export class PostProposalImpressionsRangeRule implements PostProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PostProposal): string[] {
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

export class PostProposalCostRangeRule implements PostProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PostProposal): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PostProposalRequiredLocaleRule implements PostProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostProposal): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class PostProposalLocaleLengthRule implements PostProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostProposal): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostProposalRequiredCodeRule implements PostProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostProposal): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PostProposalCodePrefixRule implements PostProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PostProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a post proposal. */
export class PostProposalValidator {
  rules: PostProposalRule[];

  constructor(rules: PostProposalRule[]) {
    this.rules = rules;
  }

  validate(item: PostProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PostProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostProposal[]): Map<string, string[]> {
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

export function defaultPostProposalValidator(): PostProposalValidator {
  return new PostProposalValidator(
    [
      new PostProposalImpressionsRangeRule(16, 255),
      new PostProposalCostRangeRule(6.8, 4134.1),
      new PostProposalRequiredLocaleRule("post proposal needs this field"),
      new PostProposalLocaleLengthRule(1000),
      new PostProposalRequiredCodeRule("post proposal needs an entry"),
      new PostProposalCodePrefixRule("OPS"),
    ],
  );
}
