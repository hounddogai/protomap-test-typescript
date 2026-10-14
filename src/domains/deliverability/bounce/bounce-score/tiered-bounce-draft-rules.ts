import { TieredBounceDraft } from "./tiered-bounce-draft.js";

/** A rule a tiered bounce draft must pass. Check returns its problems, or none. */
export interface TieredBounceDraftRule {
  check(item: TieredBounceDraft): string[];
}

export class TieredBounceDraftRequiredChannelRule implements TieredBounceDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredBounceDraft): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class TieredBounceDraftNameLengthRule implements TieredBounceDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredBounceDraft): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredBounceDraftScoreRangeRule implements TieredBounceDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredBounceDraft): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredBounceDraftRequiredCodeRule implements TieredBounceDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredBounceDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredBounceDraftChannelLengthRule implements TieredBounceDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredBounceDraft): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredBounceDraftContactEmailLengthRule implements TieredBounceDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredBounceDraft): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered bounce draft. */
export class TieredBounceDraftValidator {
  rules: TieredBounceDraftRule[];

  constructor(rules: TieredBounceDraftRule[]) {
    this.rules = rules;
  }

  validate(item: TieredBounceDraft): string[] {
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

  requireValid(item: TieredBounceDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredBounceDraft[]): Map<string, string[]> {
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

export function defaultTieredBounceDraftValidator(): TieredBounceDraftValidator {
  return new TieredBounceDraftValidator(
    [
      new TieredBounceDraftRequiredChannelRule("tiered bounce draft needs an entry"),
      new TieredBounceDraftNameLengthRule(16),
      new TieredBounceDraftScoreRangeRule(8.8, 4434.3),
      new TieredBounceDraftRequiredCodeRule("tiered bounce draft needs an entry"),
      new TieredBounceDraftChannelLengthRule(80),
      new TieredBounceDraftContactEmailLengthRule(255),
    ],
  );
}
