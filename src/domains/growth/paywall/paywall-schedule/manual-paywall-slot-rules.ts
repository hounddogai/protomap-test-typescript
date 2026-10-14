import * as text from "../../../../kit/text.js";
import { ManualPaywallSlot } from "./manual-paywall-slot.js";

/** A rule a manual paywall slot must pass. Check returns its problems, or none. */
export interface ManualPaywallSlotRule {
  check(item: ManualPaywallSlot): string[];
}

export class ManualPaywallSlotChecksumLengthRule implements ManualPaywallSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualPaywallSlot): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualPaywallSlotRequiredTitleRule implements ManualPaywallSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPaywallSlot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPaywallSlotAllowedCohortRule implements ManualPaywallSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualPaywallSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is duplicated`];
    return [];
  }
}

export class ManualPaywallSlotRequiredCodeRule implements ManualPaywallSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPaywallSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPaywallSlotCohortLengthRule implements ManualPaywallSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualPaywallSlot): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualPaywallSlotThresholdRangeRule implements ManualPaywallSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualPaywallSlot): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a manual paywall slot. */
export class ManualPaywallSlotValidator {
  rules: ManualPaywallSlotRule[];

  constructor(rules: ManualPaywallSlotRule[]) {
    this.rules = rules;
  }

  validate(item: ManualPaywallSlot): string[] {
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

  requireValid(item: ManualPaywallSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualPaywallSlot[]): Map<string, string[]> {
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

export function defaultManualPaywallSlotValidator(): ManualPaywallSlotValidator {
  return new ManualPaywallSlotValidator(
    [
      new ManualPaywallSlotChecksumLengthRule(80),
      new ManualPaywallSlotRequiredTitleRule("manual paywall slot needs this field"),
      new ManualPaywallSlotAllowedCohortRule(["tiered", "legacy", "batched"]),
      new ManualPaywallSlotRequiredCodeRule("manual paywall slot needs this field"),
      new ManualPaywallSlotCohortLengthRule(32),
      new ManualPaywallSlotThresholdRangeRule(5.1, 4055.7),
    ],
  );
}
