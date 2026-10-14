import { LegacyLeaderboardDraft } from "./legacy-leaderboard-draft.js";

/** A rule a legacy leaderboard draft must pass. Check returns its problems, or none. */
export interface LegacyLeaderboardDraftRule {
  check(item: LegacyLeaderboardDraft): string[];
}

export class LegacyLeaderboardDraftDescriptionLengthRule implements LegacyLeaderboardDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyLeaderboardDraft): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyLeaderboardDraftLabelLengthRule implements LegacyLeaderboardDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyLeaderboardDraft): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyLeaderboardDraftRequiredJourneyIdRule implements LegacyLeaderboardDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyLeaderboardDraft): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy leaderboard draft. */
export class LegacyLeaderboardDraftValidator {
  rules: LegacyLeaderboardDraftRule[];

  constructor(rules: LegacyLeaderboardDraftRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyLeaderboardDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyLeaderboardDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyLeaderboardDraft[]): Map<string, string[]> {
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

export function defaultLegacyLeaderboardDraftValidator(): LegacyLeaderboardDraftValidator {
  return new LegacyLeaderboardDraftValidator(
    [
      new LegacyLeaderboardDraftDescriptionLengthRule(86400),
      new LegacyLeaderboardDraftLabelLengthRule(86400),
      new LegacyLeaderboardDraftRequiredJourneyIdRule("legacy leaderboard draft needs an entry"),
    ],
  );
}
