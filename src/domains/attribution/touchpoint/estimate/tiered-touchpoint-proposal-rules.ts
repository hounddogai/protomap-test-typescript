import * as text from "../../../../kit/text.js";
import { TieredTouchpointProposal } from "./tiered-touchpoint-proposal.js";

/** A rule a tiered touchpoint proposal must pass. Check returns its problems, or none. */
export interface TieredTouchpointProposalRule {
  check(item: TieredTouchpointProposal): string[];
}

export class TieredTouchpointProposalVersionRangeRule implements TieredTouchpointProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredTouchpointProposal): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredTouchpointProposalSegmentLengthRule implements TieredTouchpointProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredTouchpointProposal): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredTouchpointProposalRequiredNameRule implements TieredTouchpointProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredTouchpointProposal): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TieredTouchpointProposalMinimumRangeRule implements TieredTouchpointProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredTouchpointProposal): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredTouchpointProposalRequiredCodeRule implements TieredTouchpointProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredTouchpointProposal): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredTouchpointProposalAllowedVariantRule implements TieredTouchpointProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredTouchpointProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.variant))) return [`variant ${item.variant} is duplicated`];
    return [];
  }
}

/** Runs every rule of a tiered touchpoint proposal. */
export class TieredTouchpointProposalValidator {
  rules: TieredTouchpointProposalRule[];

  constructor(rules: TieredTouchpointProposalRule[]) {
    this.rules = rules;
  }

  validate(item: TieredTouchpointProposal): string[] {
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

  requireValid(item: TieredTouchpointProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredTouchpointProposal[]): Map<string, string[]> {
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

export function defaultTieredTouchpointProposalValidator(): TieredTouchpointProposalValidator {
  return new TieredTouchpointProposalValidator(
    [
      new TieredTouchpointProposalVersionRangeRule(120, 3600),
      new TieredTouchpointProposalSegmentLengthRule(3600),
      new TieredTouchpointProposalRequiredNameRule("tiered touchpoint proposal needs this field"),
      new TieredTouchpointProposalMinimumRangeRule(9.1, 4376.2),
      new TieredTouchpointProposalRequiredCodeRule("tiered touchpoint proposal needs this field"),
      new TieredTouchpointProposalAllowedVariantRule(["adaptive", "lenient", "regional"]),
    ],
  );
}
