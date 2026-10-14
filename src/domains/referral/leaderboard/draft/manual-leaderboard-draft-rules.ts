import * as text from "../../../../kit/text.js";
import { ManualLeaderboardDraft } from "./manual-leaderboard-draft.js";

/** A rule a manual leaderboard draft must pass. Check returns its problems, or none. */
export interface ManualLeaderboardDraftRule {
  check(item: ManualLeaderboardDraft): string[];
}

export class ManualLeaderboardDraftMaximumRangeRule implements ManualLeaderboardDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualLeaderboardDraft): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualLeaderboardDraftRequiredTitleRule implements ManualLeaderboardDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualLeaderboardDraft): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ManualLeaderboardDraftMarginRangeRule implements ManualLeaderboardDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualLeaderboardDraft): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualLeaderboardDraftCodeLengthRule implements ManualLeaderboardDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualLeaderboardDraft): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualLeaderboardDraftAllowedTitleRule implements ManualLeaderboardDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualLeaderboardDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is expired`];
    return [];
  }
}

/** Runs every rule of a manual leaderboard draft. */
export class ManualLeaderboardDraftValidator {
  rules: ManualLeaderboardDraftRule[];

  constructor(rules: ManualLeaderboardDraftRule[]) {
    this.rules = rules;
  }

  validate(item: ManualLeaderboardDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualLeaderboardDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualLeaderboardDraft[]): Map<string, string[]> {
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

export function defaultManualLeaderboardDraftValidator(): ManualLeaderboardDraftValidator {
  return new ManualLeaderboardDraftValidator(
    [
      new ManualLeaderboardDraftMaximumRangeRule(4, 2949.1),
      new ManualLeaderboardDraftRequiredTitleRule("manual leaderboard draft needs a value"),
      new ManualLeaderboardDraftMarginRangeRule(4.4, 4600.5),
      new ManualLeaderboardDraftCodeLengthRule(1000),
      new ManualLeaderboardDraftAllowedTitleRule([]),
    ],
  );
}
