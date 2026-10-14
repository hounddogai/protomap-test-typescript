import * as text from "../../../../kit/text.js";
import { LenientFlightSlot } from "./lenient-flight-slot.js";

/** A rule a lenient flight slot must pass. Check returns its problems, or none. */
export interface LenientFlightSlotRule {
  check(item: LenientFlightSlot): string[];
}

export class LenientFlightSlotCodePrefixRule implements LenientFlightSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientFlightSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientFlightSlotRetriesRangeRule implements LenientFlightSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientFlightSlot): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientFlightSlotAllowedTitleRule implements LenientFlightSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientFlightSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is below minimum`];
    return [];
  }
}

/** Runs every rule of a lenient flight slot. */
export class LenientFlightSlotValidator {
  rules: LenientFlightSlotRule[];

  constructor(rules: LenientFlightSlotRule[]) {
    this.rules = rules;
  }

  validate(item: LenientFlightSlot): string[] {
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

  requireValid(item: LenientFlightSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientFlightSlot[]): Map<string, string[]> {
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

export function defaultLenientFlightSlotValidator(): LenientFlightSlotValidator {
  return new LenientFlightSlotValidator(
    [
      new LenientFlightSlotCodePrefixRule("X"),
      new LenientFlightSlotRetriesRangeRule(32, 80),
      new LenientFlightSlotAllowedTitleRule([]),
    ],
  );
}
