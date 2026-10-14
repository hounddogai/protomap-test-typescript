import { ReplyDraft } from "./reply-draft.js";

/** A rule a reply draft must pass. Check returns its problems, or none. */
export interface ReplyDraftRule {
  check(item: ReplyDraft): string[];
}

export class ReplyDraftClicksRangeRule implements ReplyDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplyDraft): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ReplyDraftChannelLengthRule implements ReplyDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyDraft): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReplyDraftRequiredLocaleRule implements ReplyDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyDraft): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reply draft. */
export class ReplyDraftValidator {
  rules: ReplyDraftRule[];

  constructor(rules: ReplyDraftRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyDraft): string[] {
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

  requireValid(item: ReplyDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyDraft[]): Map<string, string[]> {
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

export function defaultReplyDraftValidator(): ReplyDraftValidator {
  return new ReplyDraftValidator(
    [
      new ReplyDraftClicksRangeRule(120, 3600),
      new ReplyDraftChannelLengthRule(255),
      new ReplyDraftRequiredLocaleRule("reply draft needs this field"),
    ],
  );
}
