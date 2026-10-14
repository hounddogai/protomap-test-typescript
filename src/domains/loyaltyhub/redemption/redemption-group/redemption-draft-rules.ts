import { RedemptionDraft } from "./redemption-draft.js";

/** A rule a redemption draft must pass. Check returns its problems, or none. */
export interface RedemptionDraftRule {
  check(item: RedemptionDraft): string[];
}

export class RedemptionDraftJourneyIdLengthRule implements RedemptionDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionDraft): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionDraftScoreRangeRule implements RedemptionDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RedemptionDraft): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RedemptionDraftPinnedGuardRule implements RedemptionDraftRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RedemptionDraft): string[] {
    if (item.pinned && item.sendAt > this.limit) return [`send at ${item.sendAt} exceeds ${this.limit} while pinned`];
    return [];
  }
}

/** Runs every rule of a redemption draft. */
export class RedemptionDraftValidator {
  rules: RedemptionDraftRule[];

  constructor(rules: RedemptionDraftRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RedemptionDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionDraft[]): Map<string, string[]> {
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

export function defaultRedemptionDraftValidator(): RedemptionDraftValidator {
  return new RedemptionDraftValidator(
    [
      new RedemptionDraftJourneyIdLengthRule(64),
      new RedemptionDraftScoreRangeRule(5.4, 1112),
      new RedemptionDraftPinnedGuardRule(1000),
    ],
  );
}
