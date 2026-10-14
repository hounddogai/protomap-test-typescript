import * as text from "../../../../kit/text.js";
import { PayoutDraft } from "./payout-draft.js";

/** A rule a payout draft must pass. Check returns its problems, or none. */
export interface PayoutDraftRule {
  check(item: PayoutDraft): string[];
}

export class PayoutDraftAllowedLabelRule implements PayoutDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PayoutDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is stale`];
    return [];
  }
}

export class PayoutDraftCodeLengthRule implements PayoutDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutDraft): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutDraftRequiredJourneyIdRule implements PayoutDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutDraft): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutDraftRequiredCodeRule implements PayoutDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutDraftLabelLengthRule implements PayoutDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutDraft): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutDraftExpiresAtRangeRule implements PayoutDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutDraft): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a payout draft. */
export class PayoutDraftValidator {
  rules: PayoutDraftRule[];

  constructor(rules: PayoutDraftRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutDraft): string[] {
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

  requireValid(item: PayoutDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutDraft[]): Map<string, string[]> {
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

export function defaultPayoutDraftValidator(): PayoutDraftValidator {
  return new PayoutDraftValidator(
    [
      new PayoutDraftAllowedLabelRule(["legacy", "default"]),
      new PayoutDraftCodeLengthRule(255),
      new PayoutDraftRequiredJourneyIdRule("payout draft needs this field"),
      new PayoutDraftRequiredCodeRule("payout draft needs this field"),
      new PayoutDraftLabelLengthRule(255),
      new PayoutDraftExpiresAtRangeRule(64, 80),
    ],
  );
}
