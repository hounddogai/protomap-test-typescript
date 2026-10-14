import * as text from "../../../../kit/text.js";
import { PendingBidRuleScore } from "./pending-bid-rule-score.js";

/** A rule a pending bid rule score must pass. Check returns its problems, or none. */
export interface PendingBidRuleScoreRule {
  check(item: PendingBidRuleScore): string[];
}

export class PendingBidRuleScoreRequiredLabelRule implements PendingBidRuleScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingBidRuleScore): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PendingBidRuleScoreCodePrefixRule implements PendingBidRuleScoreRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingBidRuleScore): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingBidRuleScoreLabelLengthRule implements PendingBidRuleScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingBidRuleScore): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingBidRuleScoreAllowedUtmSourceRule implements PendingBidRuleScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingBidRuleScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is above maximum`];
    return [];
  }
}

/** Runs every rule of a pending bid rule score. */
export class PendingBidRuleScoreValidator {
  rules: PendingBidRuleScoreRule[];

  constructor(rules: PendingBidRuleScoreRule[]) {
    this.rules = rules;
  }

  validate(item: PendingBidRuleScore): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingBidRuleScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingBidRuleScore[]): Map<string, string[]> {
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

export function defaultPendingBidRuleScoreValidator(): PendingBidRuleScoreValidator {
  return new PendingBidRuleScoreValidator(
    [
      new PendingBidRuleScoreRequiredLabelRule("pending bid rule score needs an entry"),
      new PendingBidRuleScoreCodePrefixRule("OPS"),
      new PendingBidRuleScoreLabelLengthRule(120),
      new PendingBidRuleScoreAllowedUtmSourceRule([]),
    ],
  );
}
