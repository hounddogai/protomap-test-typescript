import * as text from "../../../../kit/text.js";
import { SuppressionProposal } from "./suppression-proposal.js";

/** A rule a suppression proposal must pass. Check returns its problems, or none. */
export interface SuppressionProposalRule {
  check(item: SuppressionProposal): string[];
}

export class SuppressionProposalCodePrefixRule implements SuppressionProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SuppressionProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SuppressionProposalOpenRateRangeRule implements SuppressionProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionProposal): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SuppressionProposalAllowedNameRule implements SuppressionProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SuppressionProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is expired`];
    return [];
  }
}

export class SuppressionProposalCapacityRangeRule implements SuppressionProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionProposal): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SuppressionProposalChannelLengthRule implements SuppressionProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SuppressionProposal): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SuppressionProposalActiveGuardRule implements SuppressionProposalRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SuppressionProposal): string[] {
    if (item.active && item.capacity > this.limit) return [`capacity ${item.capacity} exceeds ${this.limit} while active`];
    return [];
  }
}

/** Runs every rule of a suppression proposal. */
export class SuppressionProposalValidator {
  rules: SuppressionProposalRule[];

  constructor(rules: SuppressionProposalRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionProposal): string[] {
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

  requireValid(item: SuppressionProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionProposal[]): Map<string, string[]> {
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

export function defaultSuppressionProposalValidator(): SuppressionProposalValidator {
  return new SuppressionProposalValidator(
    [
      new SuppressionProposalCodePrefixRule("Q"),
      new SuppressionProposalOpenRateRangeRule(3.7, 4646.1),
      new SuppressionProposalAllowedNameRule([]),
      new SuppressionProposalCapacityRangeRule(255, 3600),
      new SuppressionProposalChannelLengthRule(80),
      new SuppressionProposalActiveGuardRule(1000),
    ],
  );
}
