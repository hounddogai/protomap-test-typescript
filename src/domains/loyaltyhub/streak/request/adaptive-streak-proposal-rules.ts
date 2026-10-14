import * as text from "../../../../kit/text.js";
import { AdaptiveStreakProposal } from "./adaptive-streak-proposal.js";

/** A rule a adaptive streak proposal must pass. Check returns its problems, or none. */
export interface AdaptiveStreakProposalRule {
  check(item: AdaptiveStreakProposal): string[];
}

export class AdaptiveStreakProposalRequiredCodeRule implements AdaptiveStreakProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveStreakProposal): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveStreakProposalAllowedCodeRule implements AdaptiveStreakProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveStreakProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

export class AdaptiveStreakProposalOpenRateRangeRule implements AdaptiveStreakProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveStreakProposal): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveStreakProposalCeilingRangeRule implements AdaptiveStreakProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveStreakProposal): string[] {
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

export class AdaptiveStreakProposalTitleLengthRule implements AdaptiveStreakProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveStreakProposal): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveStreakProposalUnitLengthRule implements AdaptiveStreakProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveStreakProposal): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive streak proposal. */
export class AdaptiveStreakProposalValidator {
  rules: AdaptiveStreakProposalRule[];

  constructor(rules: AdaptiveStreakProposalRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveStreakProposal): string[] {
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

  requireValid(item: AdaptiveStreakProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveStreakProposal[]): Map<string, string[]> {
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

export function defaultAdaptiveStreakProposalValidator(): AdaptiveStreakProposalValidator {
  return new AdaptiveStreakProposalValidator(
    [
      new AdaptiveStreakProposalRequiredCodeRule("adaptive streak proposal needs an entry"),
      new AdaptiveStreakProposalAllowedCodeRule(["batched", "primary"]),
      new AdaptiveStreakProposalOpenRateRangeRule(6.8, 4328.2),
      new AdaptiveStreakProposalCeilingRangeRule(2.2, 2925),
      new AdaptiveStreakProposalTitleLengthRule(1000),
      new AdaptiveStreakProposalUnitLengthRule(255),
    ],
  );
}
