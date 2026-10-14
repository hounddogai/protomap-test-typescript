import * as text from "../../../../kit/text.js";
import { CappedReputationDraft } from "./capped-reputation-draft.js";

/** A rule a capped reputation draft must pass. Check returns its problems, or none. */
export interface CappedReputationDraftRule {
  check(item: CappedReputationDraft): string[];
}

export class CappedReputationDraftRequiredTitleRule implements CappedReputationDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedReputationDraft): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CappedReputationDraftAllowedUtmSourceRule implements CappedReputationDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedReputationDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is missing`];
    return [];
  }
}

export class CappedReputationDraftRequiredReviewerRule implements CappedReputationDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedReputationDraft): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class CappedReputationDraftTitleLengthRule implements CappedReputationDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedReputationDraft): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped reputation draft. */
export class CappedReputationDraftValidator {
  rules: CappedReputationDraftRule[];

  constructor(rules: CappedReputationDraftRule[]) {
    this.rules = rules;
  }

  validate(item: CappedReputationDraft): string[] {
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

  requireValid(item: CappedReputationDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedReputationDraft[]): Map<string, string[]> {
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

export function defaultCappedReputationDraftValidator(): CappedReputationDraftValidator {
  return new CappedReputationDraftValidator(
    [
      new CappedReputationDraftRequiredTitleRule("capped reputation draft needs this field"),
      new CappedReputationDraftAllowedUtmSourceRule(["seasonal"]),
      new CappedReputationDraftRequiredReviewerRule("capped reputation draft needs a value"),
      new CappedReputationDraftTitleLengthRule(255),
    ],
  );
}
