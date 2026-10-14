import * as text from "../../../../kit/text.js";
import { ReplyProfile } from "./reply-profile.js";

/** A rule a reply profile must pass. Check returns its problems, or none. */
export interface ReplyProfileRule {
  check(item: ReplyProfile): string[];
}

export class ReplyProfileRequiredCodeRule implements ReplyProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplyProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ReplyProfileLimitRangeRule implements ReplyProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplyProfile): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReplyProfileAllowedCodeRule implements ReplyProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ReplyProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class ReplyProfileCodePrefixRule implements ReplyProfileRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ReplyProfile): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ReplyProfileBatchSizeRangeRule implements ReplyProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplyProfile): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a reply profile. */
export class ReplyProfileValidator {
  rules: ReplyProfileRule[];

  constructor(rules: ReplyProfileRule[]) {
    this.rules = rules;
  }

  validate(item: ReplyProfile): string[] {
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

  requireValid(item: ReplyProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplyProfile[]): Map<string, string[]> {
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

export function defaultReplyProfileValidator(): ReplyProfileValidator {
  return new ReplyProfileValidator(
    [
      new ReplyProfileRequiredCodeRule("reply profile needs a value"),
      new ReplyProfileLimitRangeRule(64, 3600),
      new ReplyProfileAllowedCodeRule(["legacy", "scheduled"]),
      new ReplyProfileCodePrefixRule("X"),
      new ReplyProfileBatchSizeRangeRule(32, 86400),
    ],
  );
}
