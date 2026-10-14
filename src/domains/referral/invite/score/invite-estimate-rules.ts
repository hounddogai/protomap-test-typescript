import * as text from "../../../../kit/text.js";
import { InviteEstimate } from "./invite-estimate.js";

/** A rule a invite estimate must pass. Check returns its problems, or none. */
export interface InviteEstimateRule {
  check(item: InviteEstimate): string[];
}

export class InviteEstimateAllowedExternalRefRule implements InviteEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: InviteEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is not allowed`];
    return [];
  }
}

export class InviteEstimateGraceDaysRangeRule implements InviteEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InviteEstimate): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class InviteEstimateRequiredCodeRule implements InviteEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteEstimate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a invite estimate. */
export class InviteEstimateValidator {
  rules: InviteEstimateRule[];

  constructor(rules: InviteEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: InviteEstimate): string[] {
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

  requireValid(item: InviteEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteEstimate[]): Map<string, string[]> {
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

export function defaultInviteEstimateValidator(): InviteEstimateValidator {
  return new InviteEstimateValidator(
    [
      new InviteEstimateAllowedExternalRefRule(["capped", "regional", "manual"]),
      new InviteEstimateGraceDaysRangeRule(120, 1000),
      new InviteEstimateRequiredCodeRule("invite estimate needs this field"),
    ],
  );
}
