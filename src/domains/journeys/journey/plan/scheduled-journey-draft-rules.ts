import { ScheduledJourneyDraft } from "./scheduled-journey-draft.js";

/** A rule a scheduled journey draft must pass. Check returns its problems, or none. */
export interface ScheduledJourneyDraftRule {
  check(item: ScheduledJourneyDraft): string[];
}

export class ScheduledJourneyDraftCodeLengthRule implements ScheduledJourneyDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledJourneyDraft): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledJourneyDraftBudgetRangeRule implements ScheduledJourneyDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledJourneyDraft): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledJourneyDraftRequiredRegionRule implements ScheduledJourneyDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledJourneyDraft): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled journey draft. */
export class ScheduledJourneyDraftValidator {
  rules: ScheduledJourneyDraftRule[];

  constructor(rules: ScheduledJourneyDraftRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledJourneyDraft): string[] {
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

  requireValid(item: ScheduledJourneyDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledJourneyDraft[]): Map<string, string[]> {
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

export function defaultScheduledJourneyDraftValidator(): ScheduledJourneyDraftValidator {
  return new ScheduledJourneyDraftValidator(
    [
      new ScheduledJourneyDraftCodeLengthRule(86400),
      new ScheduledJourneyDraftBudgetRangeRule(1.6, 680.7),
      new ScheduledJourneyDraftRequiredRegionRule("scheduled journey draft needs an entry"),
    ],
  );
}
