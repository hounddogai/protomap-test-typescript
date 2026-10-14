import * as text from "../../../../kit/text.js";
import { FallbackCohortSlot } from "./fallback-cohort-slot.js";

/** A rule a fallback cohort slot must pass. Check returns its problems, or none. */
export interface FallbackCohortSlotRule {
  check(item: FallbackCohortSlot): string[];
}

export class FallbackCohortSlotRequiredTimezoneRule implements FallbackCohortSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackCohortSlot): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackCohortSlotCodePrefixRule implements FallbackCohortSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackCohortSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackCohortSlotAllowedCohortRule implements FallbackCohortSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackCohortSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is below minimum`];
    return [];
  }
}

export class FallbackCohortSlotCohortLengthRule implements FallbackCohortSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackCohortSlot): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback cohort slot. */
export class FallbackCohortSlotValidator {
  rules: FallbackCohortSlotRule[];

  constructor(rules: FallbackCohortSlotRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackCohortSlot): string[] {
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

  requireValid(item: FallbackCohortSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackCohortSlot[]): Map<string, string[]> {
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

export function defaultFallbackCohortSlotValidator(): FallbackCohortSlotValidator {
  return new FallbackCohortSlotValidator(
    [
      new FallbackCohortSlotRequiredTimezoneRule("fallback cohort slot needs a value"),
      new FallbackCohortSlotCodePrefixRule("ACM"),
      new FallbackCohortSlotAllowedCohortRule(["rolling", "rolling"]),
      new FallbackCohortSlotCohortLengthRule(64),
    ],
  );
}
