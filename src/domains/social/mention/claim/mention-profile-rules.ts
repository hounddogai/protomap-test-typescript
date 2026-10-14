import * as text from "../../../../kit/text.js";
import { MentionProfile } from "./mention-profile.js";

/** A rule a mention profile must pass. Check returns its problems, or none. */
export interface MentionProfileRule {
  check(item: MentionProfile): string[];
}

export class MentionProfileMinimumRangeRule implements MentionProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MentionProfile): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class MentionProfileCodePrefixRule implements MentionProfileRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: MentionProfile): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class MentionProfileDescriptionLengthRule implements MentionProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionProfile): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MentionProfileRequiredCurrencyRule implements MentionProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MentionProfile): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class MentionProfileAllowedCodeRule implements MentionProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: MentionProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class MentionProfileCodeLengthRule implements MentionProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MentionProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a mention profile. */
export class MentionProfileValidator {
  rules: MentionProfileRule[];

  constructor(rules: MentionProfileRule[]) {
    this.rules = rules;
  }

  validate(item: MentionProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MentionProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MentionProfile[]): Map<string, string[]> {
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

export function defaultMentionProfileValidator(): MentionProfileValidator {
  return new MentionProfileValidator(
    [
      new MentionProfileMinimumRangeRule(1.1, 84.4),
      new MentionProfileCodePrefixRule("OPS"),
      new MentionProfileDescriptionLengthRule(64),
      new MentionProfileRequiredCurrencyRule("mention profile needs an entry"),
      new MentionProfileAllowedCodeRule(["scheduled"]),
      new MentionProfileCodeLengthRule(120),
    ],
  );
}
