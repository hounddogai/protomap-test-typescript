import * as text from "../../../../kit/text.js";
import { RegionalReplyDraft } from "./regional-reply-draft.js";

/** A rule a regional reply draft must pass. Check returns its problems, or none. */
export interface RegionalReplyDraftRule {
  check(item: RegionalReplyDraft): string[];
}

export class RegionalReplyDraftLabelLengthRule implements RegionalReplyDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalReplyDraft): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalReplyDraftAllowedLabelRule implements RegionalReplyDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalReplyDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is below minimum`];
    return [];
  }
}

export class RegionalReplyDraftRequiredCountryRule implements RegionalReplyDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalReplyDraft): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalReplyDraftMarginRangeRule implements RegionalReplyDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalReplyDraft): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a regional reply draft. */
export class RegionalReplyDraftValidator {
  rules: RegionalReplyDraftRule[];

  constructor(rules: RegionalReplyDraftRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalReplyDraft): string[] {
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

  requireValid(item: RegionalReplyDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalReplyDraft[]): Map<string, string[]> {
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

export function defaultRegionalReplyDraftValidator(): RegionalReplyDraftValidator {
  return new RegionalReplyDraftValidator(
    [
      new RegionalReplyDraftLabelLengthRule(255),
      new RegionalReplyDraftAllowedLabelRule([]),
      new RegionalReplyDraftRequiredCountryRule("regional reply draft needs this field"),
      new RegionalReplyDraftMarginRangeRule(5.5, 1371.4),
    ],
  );
}
