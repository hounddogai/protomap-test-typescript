import { CappedMentionBaseline } from "./capped-mention-baseline.js";

/** A rule a capped mention baseline must pass. Check returns its problems, or none. */
export interface CappedMentionBaselineRule {
  check(item: CappedMentionBaseline): string[];
}

export class CappedMentionBaselineUtmSourceLengthRule implements CappedMentionBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedMentionBaseline): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedMentionBaselineRequiredTitleRule implements CappedMentionBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedMentionBaseline): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CappedMentionBaselineRequiredChannelRule implements CappedMentionBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedMentionBaseline): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class CappedMentionBaselineRequiredCodeRule implements CappedMentionBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedMentionBaseline): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedMentionBaselineChannelLengthRule implements CappedMentionBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedMentionBaseline): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped mention baseline. */
export class CappedMentionBaselineValidator {
  rules: CappedMentionBaselineRule[];

  constructor(rules: CappedMentionBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: CappedMentionBaseline): string[] {
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

  requireValid(item: CappedMentionBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedMentionBaseline[]): Map<string, string[]> {
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

export function defaultCappedMentionBaselineValidator(): CappedMentionBaselineValidator {
  return new CappedMentionBaselineValidator(
    [
      new CappedMentionBaselineUtmSourceLengthRule(255),
      new CappedMentionBaselineRequiredTitleRule("capped mention baseline needs this field"),
      new CappedMentionBaselineRequiredChannelRule("capped mention baseline needs a value"),
      new CappedMentionBaselineRequiredCodeRule("capped mention baseline needs this field"),
      new CappedMentionBaselineChannelLengthRule(32),
    ],
  );
}
