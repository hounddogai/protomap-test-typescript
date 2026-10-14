import * as text from "../../../../kit/text.js";
import { GlobalReputationProposal } from "./global-reputation-proposal.js";

/** A rule a global reputation proposal must pass. Check returns its problems, or none. */
export interface GlobalReputationProposalRule {
  check(item: GlobalReputationProposal): string[];
}

export class GlobalReputationProposalChannelLengthRule implements GlobalReputationProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalReputationProposal): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalReputationProposalPriorityRangeRule implements GlobalReputationProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalReputationProposal): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalReputationProposalRequiredChannelRule implements GlobalReputationProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalReputationProposal): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalReputationProposalVisibleGuardRule implements GlobalReputationProposalRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: GlobalReputationProposal): string[] {
    if (item.visible && item.amount > this.limit) return [`amount ${item.amount} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class GlobalReputationProposalAllowedNameRule implements GlobalReputationProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalReputationProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is not allowed`];
    return [];
  }
}

/** Runs every rule of a global reputation proposal. */
export class GlobalReputationProposalValidator {
  rules: GlobalReputationProposalRule[];

  constructor(rules: GlobalReputationProposalRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalReputationProposal): string[] {
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

  requireValid(item: GlobalReputationProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalReputationProposal[]): Map<string, string[]> {
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

export function defaultGlobalReputationProposalValidator(): GlobalReputationProposalValidator {
  return new GlobalReputationProposalValidator(
    [
      new GlobalReputationProposalChannelLengthRule(86400),
      new GlobalReputationProposalPriorityRangeRule(32, 255),
      new GlobalReputationProposalRequiredChannelRule("global reputation proposal needs an entry"),
      new GlobalReputationProposalVisibleGuardRule(4.2),
      new GlobalReputationProposalAllowedNameRule([]),
    ],
  );
}
