import { WeightedTierNotice } from "./weighted-tier-notice.js";

/** A rule a weighted tier notice must pass. Check returns its problems, or none. */
export interface WeightedTierNoticeRule {
  check(item: WeightedTierNotice): string[];
}

export class WeightedTierNoticeRequiredJourneyIdRule implements WeightedTierNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedTierNotice): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedTierNoticeJourneyIdLengthRule implements WeightedTierNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedTierNotice): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedTierNoticeCodePrefixRule implements WeightedTierNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedTierNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedTierNoticeCampaignRefLengthRule implements WeightedTierNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedTierNotice): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted tier notice. */
export class WeightedTierNoticeValidator {
  rules: WeightedTierNoticeRule[];

  constructor(rules: WeightedTierNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedTierNotice): string[] {
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

  requireValid(item: WeightedTierNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedTierNotice[]): Map<string, string[]> {
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

export function defaultWeightedTierNoticeValidator(): WeightedTierNoticeValidator {
  return new WeightedTierNoticeValidator(
    [
      new WeightedTierNoticeRequiredJourneyIdRule("weighted tier notice needs this field"),
      new WeightedTierNoticeJourneyIdLengthRule(255),
      new WeightedTierNoticeCodePrefixRule("Q"),
      new WeightedTierNoticeCampaignRefLengthRule(120),
    ],
  );
}
