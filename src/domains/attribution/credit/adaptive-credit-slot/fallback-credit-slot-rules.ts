import * as text from "../../../../kit/text.js";
import { FallbackCreditSlot } from "./fallback-credit-slot.js";

/** A rule a fallback credit slot must pass. Check returns its problems, or none. */
export interface FallbackCreditSlotRule {
  check(item: FallbackCreditSlot): string[];
}

export class FallbackCreditSlotRequiredNameRule implements FallbackCreditSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackCreditSlot): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackCreditSlotRequiredNotesRule implements FallbackCreditSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackCreditSlot): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackCreditSlotAllowedCodeRule implements FallbackCreditSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackCreditSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class FallbackCreditSlotRequiredCodeRule implements FallbackCreditSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackCreditSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackCreditSlotEndsAtRangeRule implements FallbackCreditSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackCreditSlot): string[] {
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

/** Runs every rule of a fallback credit slot. */
export class FallbackCreditSlotValidator {
  rules: FallbackCreditSlotRule[];

  constructor(rules: FallbackCreditSlotRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackCreditSlot): string[] {
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

  requireValid(item: FallbackCreditSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackCreditSlot[]): Map<string, string[]> {
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

export function defaultFallbackCreditSlotValidator(): FallbackCreditSlotValidator {
  return new FallbackCreditSlotValidator(
    [
      new FallbackCreditSlotRequiredNameRule("fallback credit slot needs a value"),
      new FallbackCreditSlotRequiredNotesRule("fallback credit slot needs a value"),
      new FallbackCreditSlotAllowedCodeRule([]),
      new FallbackCreditSlotRequiredCodeRule("fallback credit slot needs this field"),
      new FallbackCreditSlotEndsAtRangeRule(120, 1000),
    ],
  );
}
