import { ReplyRollup } from "./reply-rollup.js";

/** A rule a reply rollup must pass. Check returns its problems, or none. */
export interface ReplyRollupRule {
  check(item: ReplyRollup): string[];
}

export class ReplyRollupRequiredAudienceIdRule implements ReplyRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyRollup): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyRollupAmountRangeRule implements ReplyRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplyRollup): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReplyRollupRequiredTitleRule implements ReplyRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyRollup): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyRollupChecksumLengthRule implements ReplyRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyRollup): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReplyRollupAudienceIdLengthRule implements ReplyRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyRollup): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReplyRollupTitleLengthRule implements ReplyRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyRollup): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reply rollup. */
export class ReplyRollupValidator {
  rules: ReplyRollupRule[];

  constructor(rules: ReplyRollupRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyRollup): string[] {
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

  requireValid(item: ReplyRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyRollup[]): Map<string, string[]> {
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

export function defaultReplyRollupValidator(): ReplyRollupValidator {
  return new ReplyRollupValidator(
    [
      new ReplyRollupRequiredAudienceIdRule("reply rollup needs a value"),
      new ReplyRollupAmountRangeRule(5.9, 4806.3),
      new ReplyRollupRequiredTitleRule("reply rollup needs a value"),
      new ReplyRollupChecksumLengthRule(86400),
      new ReplyRollupAudienceIdLengthRule(80),
      new ReplyRollupTitleLengthRule(64),
    ],
  );
}
