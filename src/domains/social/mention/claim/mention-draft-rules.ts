import { MentionDraft } from "./mention-draft.js";

/** A rule a mention draft must pass. Check returns its problems, or none. */
export interface MentionDraftRule {
  check(item: MentionDraft): string[];
}

export class MentionDraftRequiredOwnerIdRule implements MentionDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionDraft): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class MentionDraftGraceDaysRangeRule implements MentionDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionDraft): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class MentionDraftNameLengthRule implements MentionDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionDraft): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a mention draft. */
export class MentionDraftValidator {
  rules: MentionDraftRule[];

  constructor(rules: MentionDraftRule[]) {
    this.rules = rules;
  }

  validate(item: MentionDraft): string[] {
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

  requireValid(item: MentionDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionDraft[]): Map<string, string[]> {
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

export function defaultMentionDraftValidator(): MentionDraftValidator {
  return new MentionDraftValidator(
    [
      new MentionDraftRequiredOwnerIdRule("mention draft needs this field"),
      new MentionDraftGraceDaysRangeRule(120, 3600),
      new MentionDraftNameLengthRule(32),
    ],
  );
}
