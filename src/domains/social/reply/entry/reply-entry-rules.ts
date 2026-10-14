import { ReplyEntry } from "./reply-entry.js";

/** A rule a reply entry must pass. Check returns its problems, or none. */
export interface ReplyEntryRule {
  check(item: ReplyEntry): string[];
}

export class ReplyEntryScoreRangeRule implements ReplyEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplyEntry): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReplyEntryRequiredChannelRule implements ReplyEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyEntry): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyEntryCodePrefixRule implements ReplyEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ReplyEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ReplyEntryApprovedGuardRule implements ReplyEntryRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ReplyEntry): string[] {
    if (item.approved && item.impressions > this.limit) return [`impressions ${item.impressions} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class ReplyEntryRequiredChecksumRule implements ReplyEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyEntry): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyEntryCodeLengthRule implements ReplyEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplyEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reply entry. */
export class ReplyEntryValidator {
  rules: ReplyEntryRule[];

  constructor(rules: ReplyEntryRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyEntry): string[] {
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

  requireValid(item: ReplyEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyEntry[]): Map<string, string[]> {
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

export function defaultReplyEntryValidator(): ReplyEntryValidator {
  return new ReplyEntryValidator(
    [
      new ReplyEntryScoreRangeRule(3.2, 2626.1),
      new ReplyEntryRequiredChannelRule("reply entry needs this field"),
      new ReplyEntryCodePrefixRule("Q"),
      new ReplyEntryApprovedGuardRule(32),
      new ReplyEntryRequiredChecksumRule("reply entry needs an entry"),
      new ReplyEntryCodeLengthRule(80),
    ],
  );
}
