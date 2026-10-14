import { FallbackNudgeProposal } from "./fallback-nudge-proposal.js";

/** A rule a fallback nudge proposal must pass. Check returns its problems, or none. */
export interface FallbackNudgeProposalRule {
  check(item: FallbackNudgeProposal): string[];
}

export class FallbackNudgeProposalCodePrefixRule implements FallbackNudgeProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackNudgeProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackNudgeProposalLocaleLengthRule implements FallbackNudgeProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackNudgeProposal): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackNudgeProposalLabelLengthRule implements FallbackNudgeProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackNudgeProposal): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackNudgeProposalRequiredLocaleRule implements FallbackNudgeProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackNudgeProposal): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackNudgeProposalBudgetRangeRule implements FallbackNudgeProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackNudgeProposal): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackNudgeProposalActiveGuardRule implements FallbackNudgeProposalRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FallbackNudgeProposal): string[] {
    if (item.active && item.budget > this.limit) return [`budget ${item.budget} exceeds ${this.limit} while active`];
    return [];
  }
}

/** Runs every rule of a fallback nudge proposal. */
export class FallbackNudgeProposalValidator {
  rules: FallbackNudgeProposalRule[];

  constructor(rules: FallbackNudgeProposalRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackNudgeProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackNudgeProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackNudgeProposal[]): Map<string, string[]> {
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

export function defaultFallbackNudgeProposalValidator(): FallbackNudgeProposalValidator {
  return new FallbackNudgeProposalValidator(
    [
      new FallbackNudgeProposalCodePrefixRule("OPS"),
      new FallbackNudgeProposalLocaleLengthRule(80),
      new FallbackNudgeProposalLabelLengthRule(1000),
      new FallbackNudgeProposalRequiredLocaleRule("fallback nudge proposal needs this field"),
      new FallbackNudgeProposalBudgetRangeRule(2, 4885.5),
      new FallbackNudgeProposalActiveGuardRule(5.4),
    ],
  );
}
