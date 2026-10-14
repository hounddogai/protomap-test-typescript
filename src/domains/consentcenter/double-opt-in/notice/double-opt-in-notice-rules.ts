import { DoubleOptInNotice } from "./double-opt-in-notice.js";

/** A rule a double opt in notice must pass. Check returns its problems, or none. */
export interface DoubleOptInNoticeRule {
  check(item: DoubleOptInNotice): string[];
}

export class DoubleOptInNoticeTitleLengthRule implements DoubleOptInNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInNotice): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DoubleOptInNoticeLimitRangeRule implements DoubleOptInNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInNotice): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DoubleOptInNoticeRequiredCampaignRefRule implements DoubleOptInNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInNotice): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInNoticeCampaignRefLengthRule implements DoubleOptInNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInNotice): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DoubleOptInNoticeCodePrefixRule implements DoubleOptInNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DoubleOptInNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a double opt in notice. */
export class DoubleOptInNoticeValidator {
  rules: DoubleOptInNoticeRule[];

  constructor(rules: DoubleOptInNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInNotice): string[] {
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

  requireValid(item: DoubleOptInNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInNotice[]): Map<string, string[]> {
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

export function defaultDoubleOptInNoticeValidator(): DoubleOptInNoticeValidator {
  return new DoubleOptInNoticeValidator(
    [
      new DoubleOptInNoticeTitleLengthRule(80),
      new DoubleOptInNoticeLimitRangeRule(16, 86400),
      new DoubleOptInNoticeRequiredCampaignRefRule("double opt in notice needs a value"),
      new DoubleOptInNoticeCampaignRefLengthRule(120),
      new DoubleOptInNoticeCodePrefixRule("X"),
    ],
  );
}
