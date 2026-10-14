import * as text from "../../../../kit/text.js";
import { BadgeSlot } from "./badge-slot.js";

/** A rule a badge slot must pass. Check returns its problems, or none. */
export interface BadgeSlotRule {
  check(item: BadgeSlot): string[];
}

export class BadgeSlotRequiredLabelRule implements BadgeSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeSlot): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeSlotEndsAtRangeRule implements BadgeSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeSlot): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BadgeSlotRequiredLocaleRule implements BadgeSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeSlot): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeSlotLocaleLengthRule implements BadgeSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeSlot): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeSlotAllowedTitleRule implements BadgeSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BadgeSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is blocked`];
    return [];
  }
}

/** Runs every rule of a badge slot. */
export class BadgeSlotValidator {
  rules: BadgeSlotRule[];

  constructor(rules: BadgeSlotRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeSlot): string[] {
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

  requireValid(item: BadgeSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeSlot[]): Map<string, string[]> {
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

export function defaultBadgeSlotValidator(): BadgeSlotValidator {
  return new BadgeSlotValidator(
    [
      new BadgeSlotRequiredLabelRule("badge slot needs a value"),
      new BadgeSlotEndsAtRangeRule(3600, 86400),
      new BadgeSlotRequiredLocaleRule("badge slot needs a value"),
      new BadgeSlotLocaleLengthRule(64),
      new BadgeSlotAllowedTitleRule(["rolling", "strict", "manual"]),
    ],
  );
}
