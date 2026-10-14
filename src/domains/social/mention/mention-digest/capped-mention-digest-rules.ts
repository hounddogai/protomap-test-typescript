import { CappedMentionDigest } from "./capped-mention-digest.js";

/** A rule a capped mention digest must pass. Check returns its problems, or none. */
export interface CappedMentionDigestRule {
  check(item: CappedMentionDigest): string[];
}

export class CappedMentionDigestAmountRangeRule implements CappedMentionDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedMentionDigest): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedMentionDigestCampaignRefLengthRule implements CappedMentionDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedMentionDigest): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedMentionDigestRequiredCampaignRefRule implements CappedMentionDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedMentionDigest): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class CappedMentionDigestMaximumRangeRule implements CappedMentionDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedMentionDigest): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedMentionDigestCodePrefixRule implements CappedMentionDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedMentionDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a capped mention digest. */
export class CappedMentionDigestValidator {
  rules: CappedMentionDigestRule[];

  constructor(rules: CappedMentionDigestRule[]) {
    this.rules = rules;
  }

  validate(item: CappedMentionDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedMentionDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedMentionDigest[]): Map<string, string[]> {
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

export function defaultCappedMentionDigestValidator(): CappedMentionDigestValidator {
  return new CappedMentionDigestValidator(
    [
      new CappedMentionDigestAmountRangeRule(5.4, 3795.6),
      new CappedMentionDigestCampaignRefLengthRule(64),
      new CappedMentionDigestRequiredCampaignRefRule("capped mention digest needs this field"),
      new CappedMentionDigestMaximumRangeRule(5.6, 3190.6),
      new CappedMentionDigestCodePrefixRule("X"),
    ],
  );
}
