import * as text from "../../../../kit/text.js";
import { CohortProposal } from "./cohort-proposal.js";

/** A rule a cohort proposal must pass. Check returns its problems, or none. */
export interface CohortProposalRule {
  check(item: CohortProposal): string[];
}

export class CohortProposalAllowedSourceRule implements CohortProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CohortProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is too long`];
    return [];
  }
}

export class CohortProposalCodePrefixRule implements CohortProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CohortProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CohortProposalRequiredTitleRule implements CohortProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortProposal): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CohortProposalCountryLengthRule implements CohortProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortProposal): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortProposalRequiredCountryRule implements CohortProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortProposal): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a cohort proposal. */
export class CohortProposalValidator {
  rules: CohortProposalRule[];

  constructor(rules: CohortProposalRule[]) {
    this.rules = rules;
  }

  validate(item: CohortProposal): string[] {
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

  requireValid(item: CohortProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortProposal[]): Map<string, string[]> {
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

export function defaultCohortProposalValidator(): CohortProposalValidator {
  return new CohortProposalValidator(
    [
      new CohortProposalAllowedSourceRule(["batched", "strict"]),
      new CohortProposalCodePrefixRule("Q"),
      new CohortProposalRequiredTitleRule("cohort proposal needs an entry"),
      new CohortProposalCountryLengthRule(80),
      new CohortProposalRequiredCountryRule("cohort proposal needs a value"),
    ],
  );
}
