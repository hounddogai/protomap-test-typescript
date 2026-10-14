import * as text from "../../../../kit/text.js";
import { LegacyComplaintDraft } from "./legacy-complaint-draft.js";

/** A rule a legacy complaint draft must pass. Check returns its problems, or none. */
export interface LegacyComplaintDraftRule {
  check(item: LegacyComplaintDraft): string[];
}

export class LegacyComplaintDraftWindowDaysRangeRule implements LegacyComplaintDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyComplaintDraft): string[] {
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

export class LegacyComplaintDraftEndsAtRangeRule implements LegacyComplaintDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyComplaintDraft): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyComplaintDraftTitleLengthRule implements LegacyComplaintDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyComplaintDraft): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyComplaintDraftAllowedChannelRule implements LegacyComplaintDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyComplaintDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is stale`];
    return [];
  }
}

export class LegacyComplaintDraftCodeLengthRule implements LegacyComplaintDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyComplaintDraft): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy complaint draft. */
export class LegacyComplaintDraftValidator {
  rules: LegacyComplaintDraftRule[];

  constructor(rules: LegacyComplaintDraftRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyComplaintDraft): string[] {
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

  requireValid(item: LegacyComplaintDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyComplaintDraft[]): Map<string, string[]> {
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

export function defaultLegacyComplaintDraftValidator(): LegacyComplaintDraftValidator {
  return new LegacyComplaintDraftValidator(
    [
      new LegacyComplaintDraftWindowDaysRangeRule(255, 86400),
      new LegacyComplaintDraftEndsAtRangeRule(32, 80),
      new LegacyComplaintDraftTitleLengthRule(64),
      new LegacyComplaintDraftAllowedChannelRule(["lenient", "scheduled"]),
      new LegacyComplaintDraftCodeLengthRule(1000),
    ],
  );
}
