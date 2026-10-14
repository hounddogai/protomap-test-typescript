import { LenientWarmupProposal } from "./lenient-warmup-proposal.js";

/** A rule a lenient warmup proposal must pass. Check returns its problems, or none. */
export interface LenientWarmupProposalRule {
  check(item: LenientWarmupProposal): string[];
}

export class LenientWarmupProposalClicksRangeRule implements LenientWarmupProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientWarmupProposal): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientWarmupProposalCodePrefixRule implements LenientWarmupProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientWarmupProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientWarmupProposalApprovedGuardRule implements LenientWarmupProposalRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LenientWarmupProposal): string[] {
    if (item.approved && item.clicks > this.limit) return [`clicks ${item.clicks} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class LenientWarmupProposalRequiredNameRule implements LenientWarmupProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientWarmupProposal): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LenientWarmupProposalLimitRangeRule implements LenientWarmupProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientWarmupProposal): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientWarmupProposalThresholdRangeRule implements LenientWarmupProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientWarmupProposal): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a lenient warmup proposal. */
export class LenientWarmupProposalValidator {
  rules: LenientWarmupProposalRule[];

  constructor(rules: LenientWarmupProposalRule[]) {
    this.rules = rules;
  }

  validate(item: LenientWarmupProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientWarmupProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientWarmupProposal[]): Map<string, string[]> {
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

export function defaultLenientWarmupProposalValidator(): LenientWarmupProposalValidator {
  return new LenientWarmupProposalValidator(
    [
      new LenientWarmupProposalClicksRangeRule(16, 80),
      new LenientWarmupProposalCodePrefixRule("Q"),
      new LenientWarmupProposalApprovedGuardRule(32),
      new LenientWarmupProposalRequiredNameRule("lenient warmup proposal needs a value"),
      new LenientWarmupProposalLimitRangeRule(1000, 86400),
      new LenientWarmupProposalThresholdRangeRule(9.5, 803.4),
    ],
  );
}
