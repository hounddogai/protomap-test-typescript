import * as text from "../../../../kit/text.js";
import { CreativeSlot } from "./creative-slot.js";

/** A rule a creative slot must pass. Check returns its problems, or none. */
export interface CreativeSlotRule {
  check(item: CreativeSlot): string[];
}

export class CreativeSlotMaximumRangeRule implements CreativeSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeSlot): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreativeSlotRegionLengthRule implements CreativeSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeSlot): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeSlotAllowedCodeRule implements CreativeSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreativeSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class CreativeSlotRequiredCodeRule implements CreativeSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a creative slot. */
export class CreativeSlotValidator {
  rules: CreativeSlotRule[];

  constructor(rules: CreativeSlotRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeSlot): string[] {
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

  requireValid(item: CreativeSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeSlot[]): Map<string, string[]> {
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

export function defaultCreativeSlotValidator(): CreativeSlotValidator {
  return new CreativeSlotValidator(
    [
      new CreativeSlotMaximumRangeRule(4.1, 3142.4),
      new CreativeSlotRegionLengthRule(1000),
      new CreativeSlotAllowedCodeRule(["adaptive", "legacy", "seasonal"]),
      new CreativeSlotRequiredCodeRule("creative slot needs this field"),
    ],
  );
}
