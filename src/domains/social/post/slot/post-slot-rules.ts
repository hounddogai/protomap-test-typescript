import * as text from "../../../../kit/text.js";
import { PostSlot } from "./post-slot.js";

/** A rule a post slot must pass. Check returns its problems, or none. */
export interface PostSlotRule {
  check(item: PostSlot): string[];
}

export class PostSlotRequiredLabelRule implements PostSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostSlot): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PostSlotAllowedLabelRule implements PostSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PostSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is blocked`];
    return [];
  }
}

export class PostSlotCodePrefixRule implements PostSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PostSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PostSlotBudgetRangeRule implements PostSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PostSlot): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PostSlotLabelLengthRule implements PostSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostSlot): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostSlotRequiredRegionRule implements PostSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostSlot): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a post slot. */
export class PostSlotValidator {
  rules: PostSlotRule[];

  constructor(rules: PostSlotRule[]) {
    this.rules = rules;
  }

  validate(item: PostSlot): string[] {
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

  requireValid(item: PostSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostSlot[]): Map<string, string[]> {
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

export function defaultPostSlotValidator(): PostSlotValidator {
  return new PostSlotValidator(
    [
      new PostSlotRequiredLabelRule("post slot needs an entry"),
      new PostSlotAllowedLabelRule(["capped"]),
      new PostSlotCodePrefixRule("REF"),
      new PostSlotBudgetRangeRule(1.7, 781.2),
      new PostSlotLabelLengthRule(16),
      new PostSlotRequiredRegionRule("post slot needs this field"),
    ],
  );
}
