import * as text from "../../../../kit/text.js";
import { DefaultActivationProposal } from "./default-activation-proposal.js";

/** A rule a default activation proposal must pass. Check returns its problems, or none. */
export interface DefaultActivationProposalRule {
  check(item: DefaultActivationProposal): string[];
}

export class DefaultActivationProposalRegionLengthRule implements DefaultActivationProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultActivationProposal): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultActivationProposalRequiredTitleRule implements DefaultActivationProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultActivationProposal): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultActivationProposalClicksRangeRule implements DefaultActivationProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultActivationProposal): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultActivationProposalRequiredRegionRule implements DefaultActivationProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultActivationProposal): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultActivationProposalCodeLengthRule implements DefaultActivationProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultActivationProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultActivationProposalAllowedTitleRule implements DefaultActivationProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultActivationProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is unknown`];
    return [];
  }
}

/** Runs every rule of a default activation proposal. */
export class DefaultActivationProposalValidator {
  rules: DefaultActivationProposalRule[];

  constructor(rules: DefaultActivationProposalRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultActivationProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultActivationProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultActivationProposal[]): Map<string, string[]> {
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

export function defaultDefaultActivationProposalValidator(): DefaultActivationProposalValidator {
  return new DefaultActivationProposalValidator(
    [
      new DefaultActivationProposalRegionLengthRule(255),
      new DefaultActivationProposalRequiredTitleRule("default activation proposal needs an entry"),
      new DefaultActivationProposalClicksRangeRule(16, 1000),
      new DefaultActivationProposalRequiredRegionRule("default activation proposal needs an entry"),
      new DefaultActivationProposalCodeLengthRule(1000),
      new DefaultActivationProposalAllowedTitleRule(["adaptive", "default", "strict"]),
    ],
  );
}
