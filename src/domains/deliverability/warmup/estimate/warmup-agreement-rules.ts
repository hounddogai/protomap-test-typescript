import { WarmupAgreement } from "./warmup-agreement.js";

/** A rule a warmup agreement must pass. Check returns its problems, or none. */
export interface WarmupAgreementRule {
  check(item: WarmupAgreement): string[];
}

export class WarmupAgreementRequiredCampaignRefRule implements WarmupAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupAgreement): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupAgreementCampaignRefLengthRule implements WarmupAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupAgreement): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WarmupAgreementStartsAtRangeRule implements WarmupAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupAgreement): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WarmupAgreementTagsLimitRule implements WarmupAgreementRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: WarmupAgreement): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class WarmupAgreementDurationMinutesRangeRule implements WarmupAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupAgreement): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WarmupAgreementCodePrefixRule implements WarmupAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WarmupAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a warmup agreement. */
export class WarmupAgreementValidator {
  rules: WarmupAgreementRule[];

  constructor(rules: WarmupAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WarmupAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupAgreement[]): Map<string, string[]> {
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

export function defaultWarmupAgreementValidator(): WarmupAgreementValidator {
  return new WarmupAgreementValidator(
    [
      new WarmupAgreementRequiredCampaignRefRule("warmup agreement needs this field"),
      new WarmupAgreementCampaignRefLengthRule(1000),
      new WarmupAgreementStartsAtRangeRule(32, 255),
      new WarmupAgreementTagsLimitRule(1000, ["pending"]),
      new WarmupAgreementDurationMinutesRangeRule(32, 80),
      new WarmupAgreementCodePrefixRule("OPS"),
    ],
  );
}
