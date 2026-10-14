import * as text from "../../../../kit/text.js";
import { RegionalApprovalSlot } from "./regional-approval-slot.js";

/** A rule a regional approval slot must pass. Check returns its problems, or none. */
export interface RegionalApprovalSlotRule {
  check(item: RegionalApprovalSlot): string[];
}

export class RegionalApprovalSlotCodeLengthRule implements RegionalApprovalSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalApprovalSlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalApprovalSlotRequiredContactEmailRule implements RegionalApprovalSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalApprovalSlot): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalApprovalSlotConversionRateRangeRule implements RegionalApprovalSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalApprovalSlot): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalApprovalSlotAllowedUnitRule implements RegionalApprovalSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalApprovalSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.unit))) return [`unit ${item.unit} is missing`];
    return [];
  }
}

export class RegionalApprovalSlotMarginRangeRule implements RegionalApprovalSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalApprovalSlot): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalApprovalSlotRequiredLabelRule implements RegionalApprovalSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalApprovalSlot): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional approval slot. */
export class RegionalApprovalSlotValidator {
  rules: RegionalApprovalSlotRule[];

  constructor(rules: RegionalApprovalSlotRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalApprovalSlot): string[] {
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

  requireValid(item: RegionalApprovalSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalApprovalSlot[]): Map<string, string[]> {
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

export function defaultRegionalApprovalSlotValidator(): RegionalApprovalSlotValidator {
  return new RegionalApprovalSlotValidator(
    [
      new RegionalApprovalSlotCodeLengthRule(16),
      new RegionalApprovalSlotRequiredContactEmailRule("regional approval slot needs an entry"),
      new RegionalApprovalSlotConversionRateRangeRule(5.8, 4749.6),
      new RegionalApprovalSlotAllowedUnitRule(["default", "tiered"]),
      new RegionalApprovalSlotMarginRangeRule(9.5, 3746.2),
      new RegionalApprovalSlotRequiredLabelRule("regional approval slot needs this field"),
    ],
  );
}
