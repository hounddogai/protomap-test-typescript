import * as text from "../../../../kit/text.js";
import { DeflectionProposal } from "./deflection-proposal.js";

/** A rule a deflection proposal must pass. Check returns its problems, or none. */
export interface DeflectionProposalRule {
  check(item: DeflectionProposal): string[];
}

export class DeflectionProposalSendAtRangeRule implements DeflectionProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionProposal): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DeflectionProposalOwnerIdLengthRule implements DeflectionProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionProposal): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionProposalAllowedNameRule implements DeflectionProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DeflectionProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is stale`];
    return [];
  }
}

export class DeflectionProposalRequiredCountryRule implements DeflectionProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionProposal): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionProposalPinnedGuardRule implements DeflectionProposalRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: DeflectionProposal): string[] {
    if (item.pinned && item.version > this.limit) return [`version ${item.version} exceeds ${this.limit} while pinned`];
    return [];
  }
}

/** Runs every rule of a deflection proposal. */
export class DeflectionProposalValidator {
  rules: DeflectionProposalRule[];

  constructor(rules: DeflectionProposalRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DeflectionProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionProposal[]): Map<string, string[]> {
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

export function defaultDeflectionProposalValidator(): DeflectionProposalValidator {
  return new DeflectionProposalValidator(
    [
      new DeflectionProposalSendAtRangeRule(16, 80),
      new DeflectionProposalOwnerIdLengthRule(120),
      new DeflectionProposalAllowedNameRule([]),
      new DeflectionProposalRequiredCountryRule("deflection proposal needs this field"),
      new DeflectionProposalPinnedGuardRule(3600),
    ],
  );
}
