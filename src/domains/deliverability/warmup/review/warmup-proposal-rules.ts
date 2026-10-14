import * as text from "../../../../kit/text.js";
import { WarmupProposal } from "./warmup-proposal.js";

/** A rule a warmup proposal must pass. Check returns its problems, or none. */
export interface WarmupProposalRule {
  check(item: WarmupProposal): string[];
}

export class WarmupProposalCodePrefixRule implements WarmupProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WarmupProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WarmupProposalMarginRangeRule implements WarmupProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupProposal): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WarmupProposalAllowedLabelRule implements WarmupProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WarmupProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is below minimum`];
    return [];
  }
}

export class WarmupProposalEndsAtRangeRule implements WarmupProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupProposal): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WarmupProposalQuantityRangeRule implements WarmupProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupProposal): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a warmup proposal. */
export class WarmupProposalValidator {
  rules: WarmupProposalRule[];

  constructor(rules: WarmupProposalRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupProposal): string[] {
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

  requireValid(item: WarmupProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupProposal[]): Map<string, string[]> {
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

export function defaultWarmupProposalValidator(): WarmupProposalValidator {
  return new WarmupProposalValidator(
    [
      new WarmupProposalCodePrefixRule("REF"),
      new WarmupProposalMarginRangeRule(5.4, 3758.9),
      new WarmupProposalAllowedLabelRule(["rolling", "strict"]),
      new WarmupProposalEndsAtRangeRule(32, 80),
      new WarmupProposalQuantityRangeRule(16, 120),
    ],
  );
}
