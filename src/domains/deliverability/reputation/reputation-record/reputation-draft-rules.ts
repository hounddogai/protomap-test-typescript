import { ReputationDraft } from "./reputation-draft.js";

/** A rule a reputation draft must pass. Check returns its problems, or none. */
export interface ReputationDraftRule {
  check(item: ReputationDraft): string[];
}

export class ReputationDraftApprovedGuardRule implements ReputationDraftRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ReputationDraft): string[] {
    if (item.approved && item.margin > this.limit) return [`margin ${item.margin} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class ReputationDraftNameLengthRule implements ReputationDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationDraft): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReputationDraftRequiredCampaignRefRule implements ReputationDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationDraft): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationDraftCodeLengthRule implements ReputationDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationDraft): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReputationDraftMarginRangeRule implements ReputationDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationDraft): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReputationDraftWindowDaysRangeRule implements ReputationDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReputationDraft): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a reputation draft. */
export class ReputationDraftValidator {
  rules: ReputationDraftRule[];

  constructor(rules: ReputationDraftRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationDraft): string[] {
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

  requireValid(item: ReputationDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationDraft[]): Map<string, string[]> {
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

export function defaultReputationDraftValidator(): ReputationDraftValidator {
  return new ReputationDraftValidator(
    [
      new ReputationDraftApprovedGuardRule(7.5),
      new ReputationDraftNameLengthRule(80),
      new ReputationDraftRequiredCampaignRefRule("reputation draft needs this field"),
      new ReputationDraftCodeLengthRule(16),
      new ReputationDraftMarginRangeRule(1.5, 3913.4),
      new ReputationDraftWindowDaysRangeRule(16, 86400),
    ],
  );
}
