import { MentionRollup } from "./mention-rollup.js";

/** A rule a mention rollup must pass. Check returns its problems, or none. */
export interface MentionRollupRule {
  check(item: MentionRollup): string[];
}

export class MentionRollupCodePrefixRule implements MentionRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: MentionRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class MentionRollupChannelLengthRule implements MentionRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionRollup): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MentionRollupArchivedGuardRule implements MentionRollupRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: MentionRollup): string[] {
    if (item.archived && item.openRate > this.limit) return [`open rate ${item.openRate} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class MentionRollupMinimumRangeRule implements MentionRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionRollup): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class MentionRollupRequiredCodeRule implements MentionRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class MentionRollupRequiredChannelRule implements MentionRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionRollup): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a mention rollup. */
export class MentionRollupValidator {
  rules: MentionRollupRule[];

  constructor(rules: MentionRollupRule[]) {
    this.rules = rules;
  }

  validate(item: MentionRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MentionRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionRollup[]): Map<string, string[]> {
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

export function defaultMentionRollupValidator(): MentionRollupValidator {
  return new MentionRollupValidator(
    [
      new MentionRollupCodePrefixRule("X"),
      new MentionRollupChannelLengthRule(86400),
      new MentionRollupArchivedGuardRule(8.3),
      new MentionRollupMinimumRangeRule(9.2, 520.5),
      new MentionRollupRequiredCodeRule("mention rollup needs a value"),
      new MentionRollupRequiredChannelRule("mention rollup needs this field"),
    ],
  );
}
