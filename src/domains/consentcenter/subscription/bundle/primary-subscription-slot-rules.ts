import * as text from "../../../../kit/text.js";
import { PrimarySubscriptionSlot } from "./primary-subscription-slot.js";

/** A rule a primary subscription slot must pass. Check returns its problems, or none. */
export interface PrimarySubscriptionSlotRule {
  check(item: PrimarySubscriptionSlot): string[];
}

export class PrimarySubscriptionSlotAllowedLabelRule implements PrimarySubscriptionSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimarySubscriptionSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is not allowed`];
    return [];
  }
}

export class PrimarySubscriptionSlotRequiredTimezoneRule implements PrimarySubscriptionSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimarySubscriptionSlot): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class PrimarySubscriptionSlotRequiredTitleRule implements PrimarySubscriptionSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimarySubscriptionSlot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PrimarySubscriptionSlotCodePrefixRule implements PrimarySubscriptionSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimarySubscriptionSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimarySubscriptionSlotDurationMinutesRangeRule implements PrimarySubscriptionSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimarySubscriptionSlot): string[] {
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

export class PrimarySubscriptionSlotTitleLengthRule implements PrimarySubscriptionSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimarySubscriptionSlot): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary subscription slot. */
export class PrimarySubscriptionSlotValidator {
  rules: PrimarySubscriptionSlotRule[];

  constructor(rules: PrimarySubscriptionSlotRule[]) {
    this.rules = rules;
  }

  validate(item: PrimarySubscriptionSlot): string[] {
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

  requireValid(item: PrimarySubscriptionSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimarySubscriptionSlot[]): Map<string, string[]> {
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

export function defaultPrimarySubscriptionSlotValidator(): PrimarySubscriptionSlotValidator {
  return new PrimarySubscriptionSlotValidator(
    [
      new PrimarySubscriptionSlotAllowedLabelRule(["manual"]),
      new PrimarySubscriptionSlotRequiredTimezoneRule("primary subscription slot needs a value"),
      new PrimarySubscriptionSlotRequiredTitleRule("primary subscription slot needs an entry"),
      new PrimarySubscriptionSlotCodePrefixRule("Q"),
      new PrimarySubscriptionSlotDurationMinutesRangeRule(32, 120),
      new PrimarySubscriptionSlotTitleLengthRule(16),
    ],
  );
}
