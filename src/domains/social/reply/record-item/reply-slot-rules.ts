import * as text from "../../../../kit/text.js";
import { ReplySlot } from "./reply-slot.js";

/** A rule a reply slot must pass. Check returns its problems, or none. */
export interface ReplySlotRule {
  check(item: ReplySlot): string[];
}

export class ReplySlotRequiredTitleRule implements ReplySlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplySlot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ReplySlotThresholdRangeRule implements ReplySlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ReplySlot): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ReplySlotRequiredSourceRule implements ReplySlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReplySlot): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class ReplySlotAllowedChecksumRule implements ReplySlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ReplySlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is below minimum`];
    return [];
  }
}

export class ReplySlotSourceLengthRule implements ReplySlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReplySlot): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReplySlotCodePrefixRule implements ReplySlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ReplySlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a reply slot. */
export class ReplySlotValidator {
  rules: ReplySlotRule[];

  constructor(rules: ReplySlotRule[]) {
    this.rules = rules;
  }

  validate(item: ReplySlot): string[] {
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

  requireValid(item: ReplySlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReplySlot[]): Map<string, string[]> {
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

export function defaultReplySlotValidator(): ReplySlotValidator {
  return new ReplySlotValidator(
    [
      new ReplySlotRequiredTitleRule("reply slot needs an entry"),
      new ReplySlotThresholdRangeRule(1.1, 170.6),
      new ReplySlotRequiredSourceRule("reply slot needs an entry"),
      new ReplySlotAllowedChecksumRule(["rolling", "batched"]),
      new ReplySlotSourceLengthRule(3600),
      new ReplySlotCodePrefixRule("X"),
    ],
  );
}
