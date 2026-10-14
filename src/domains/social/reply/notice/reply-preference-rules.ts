import { ReplyPreference } from "./reply-preference.js";

/** A rule a reply preference must pass. Check returns its problems, or none. */
export interface ReplyPreferenceRule {
  check(item: ReplyPreference): string[];
}

export class ReplyPreferenceTitleLengthRule implements ReplyPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyPreference): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReplyPreferenceRequiredTitleRule implements ReplyPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyPreference): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyPreferenceQuantityRangeRule implements ReplyPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplyPreference): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ReplyPreferenceRequiredCampaignRefRule implements ReplyPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyPreference): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyPreferenceCodeLengthRule implements ReplyPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyPreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reply preference. */
export class ReplyPreferenceValidator {
  rules: ReplyPreferenceRule[];

  constructor(rules: ReplyPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ReplyPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyPreference[]): Map<string, string[]> {
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

export function defaultReplyPreferenceValidator(): ReplyPreferenceValidator {
  return new ReplyPreferenceValidator(
    [
      new ReplyPreferenceTitleLengthRule(80),
      new ReplyPreferenceRequiredTitleRule("reply preference needs an entry"),
      new ReplyPreferenceQuantityRangeRule(32, 86400),
      new ReplyPreferenceRequiredCampaignRefRule("reply preference needs a value"),
      new ReplyPreferenceCodeLengthRule(16),
    ],
  );
}
