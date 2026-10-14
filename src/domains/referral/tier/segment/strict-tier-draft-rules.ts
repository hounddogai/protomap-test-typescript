import * as text from "../../../../kit/text.js";
import { StrictTierDraft } from "./strict-tier-draft.js";

/** A rule a strict tier draft must pass. Check returns its problems, or none. */
export interface StrictTierDraftRule {
  check(item: StrictTierDraft): string[];
}

export class StrictTierDraftSequenceRangeRule implements StrictTierDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictTierDraft): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictTierDraftAmountRangeRule implements StrictTierDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictTierDraft): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictTierDraftAllowedNameRule implements StrictTierDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictTierDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is duplicated`];
    return [];
  }
}

/** Runs every rule of a strict tier draft. */
export class StrictTierDraftValidator {
  rules: StrictTierDraftRule[];

  constructor(rules: StrictTierDraftRule[]) {
    this.rules = rules;
  }

  validate(item: StrictTierDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictTierDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictTierDraft[]): Map<string, string[]> {
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

export function defaultStrictTierDraftValidator(): StrictTierDraftValidator {
  return new StrictTierDraftValidator(
    [
      new StrictTierDraftSequenceRangeRule(120, 255),
      new StrictTierDraftAmountRangeRule(6, 456.8),
      new StrictTierDraftAllowedNameRule(["rolling", "default", "capped"]),
    ],
  );
}
