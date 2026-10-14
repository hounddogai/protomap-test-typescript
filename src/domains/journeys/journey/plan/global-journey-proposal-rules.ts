import * as text from "../../../../kit/text.js";
import { GlobalJourneyProposal } from "./global-journey-proposal.js";

/** A rule a global journey proposal must pass. Check returns its problems, or none. */
export interface GlobalJourneyProposalRule {
  check(item: GlobalJourneyProposal): string[];
}

export class GlobalJourneyProposalAllowedNameRule implements GlobalJourneyProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalJourneyProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is duplicated`];
    return [];
  }
}

export class GlobalJourneyProposalCodePrefixRule implements GlobalJourneyProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalJourneyProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalJourneyProposalCodeLengthRule implements GlobalJourneyProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalJourneyProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalJourneyProposalRequiredExternalRefRule implements GlobalJourneyProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalJourneyProposal): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalJourneyProposalExternalRefLengthRule implements GlobalJourneyProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalJourneyProposal): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalJourneyProposalRequiredCodeRule implements GlobalJourneyProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalJourneyProposal): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global journey proposal. */
export class GlobalJourneyProposalValidator {
  rules: GlobalJourneyProposalRule[];

  constructor(rules: GlobalJourneyProposalRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalJourneyProposal): string[] {
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

  requireValid(item: GlobalJourneyProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalJourneyProposal[]): Map<string, string[]> {
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

export function defaultGlobalJourneyProposalValidator(): GlobalJourneyProposalValidator {
  return new GlobalJourneyProposalValidator(
    [
      new GlobalJourneyProposalAllowedNameRule(["capped", "scheduled"]),
      new GlobalJourneyProposalCodePrefixRule("OPS"),
      new GlobalJourneyProposalCodeLengthRule(86400),
      new GlobalJourneyProposalRequiredExternalRefRule("global journey proposal needs an entry"),
      new GlobalJourneyProposalExternalRefLengthRule(32),
      new GlobalJourneyProposalRequiredCodeRule("global journey proposal needs this field"),
    ],
  );
}
