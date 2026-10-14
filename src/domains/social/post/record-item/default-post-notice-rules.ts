import { DefaultPostNotice } from "./default-post-notice.js";

/** A rule a default post notice must pass. Check returns its problems, or none. */
export interface DefaultPostNoticeRule {
  check(item: DefaultPostNotice): string[];
}

export class DefaultPostNoticeRequiredCampaignRefRule implements DefaultPostNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPostNotice): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPostNoticeCountryLengthRule implements DefaultPostNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPostNotice): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultPostNoticeCampaignRefLengthRule implements DefaultPostNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPostNotice): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultPostNoticeUpdatedAtRangeRule implements DefaultPostNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultPostNotice): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultPostNoticeCodePrefixRule implements DefaultPostNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultPostNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a default post notice. */
export class DefaultPostNoticeValidator {
  rules: DefaultPostNoticeRule[];

  constructor(rules: DefaultPostNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultPostNotice): string[] {
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

  requireValid(item: DefaultPostNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultPostNotice[]): Map<string, string[]> {
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

export function defaultDefaultPostNoticeValidator(): DefaultPostNoticeValidator {
  return new DefaultPostNoticeValidator(
    [
      new DefaultPostNoticeRequiredCampaignRefRule("default post notice needs an entry"),
      new DefaultPostNoticeCountryLengthRule(1000),
      new DefaultPostNoticeCampaignRefLengthRule(16),
      new DefaultPostNoticeUpdatedAtRangeRule(32, 86400),
      new DefaultPostNoticeCodePrefixRule("OPS"),
    ],
  );
}
