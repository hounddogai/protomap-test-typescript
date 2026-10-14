import * as text from "../../../../kit/text.js";
import { CappedSuppressionProposal } from "./capped-suppression-proposal.js";

/** A rule a capped suppression proposal must pass. Check returns its problems, or none. */
export interface CappedSuppressionProposalRule {
  check(item: CappedSuppressionProposal): string[];
}

export class CappedSuppressionProposalRegionLengthRule implements CappedSuppressionProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedSuppressionProposal): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedSuppressionProposalAllowedLabelRule implements CappedSuppressionProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedSuppressionProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is out of range`];
    return [];
  }
}

export class CappedSuppressionProposalCeilingRangeRule implements CappedSuppressionProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedSuppressionProposal): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedSuppressionProposalQuantityRangeRule implements CappedSuppressionProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedSuppressionProposal): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedSuppressionProposalCodeLengthRule implements CappedSuppressionProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedSuppressionProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedSuppressionProposalRequiredRegionRule implements CappedSuppressionProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedSuppressionProposal): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped suppression proposal. */
export class CappedSuppressionProposalValidator {
  rules: CappedSuppressionProposalRule[];

  constructor(rules: CappedSuppressionProposalRule[]) {
    this.rules = rules;
  }

  validate(item: CappedSuppressionProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedSuppressionProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedSuppressionProposal[]): Map<string, string[]> {
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

export function defaultCappedSuppressionProposalValidator(): CappedSuppressionProposalValidator {
  return new CappedSuppressionProposalValidator(
    [
      new CappedSuppressionProposalRegionLengthRule(255),
      new CappedSuppressionProposalAllowedLabelRule(["manual", "strict", "strict"]),
      new CappedSuppressionProposalCeilingRangeRule(2.8, 3136.9),
      new CappedSuppressionProposalQuantityRangeRule(120, 1000),
      new CappedSuppressionProposalCodeLengthRule(16),
      new CappedSuppressionProposalRequiredRegionRule("capped suppression proposal needs an entry"),
    ],
  );
}
