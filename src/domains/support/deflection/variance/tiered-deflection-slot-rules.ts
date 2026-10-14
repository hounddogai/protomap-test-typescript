import { TieredDeflectionSlot } from "./tiered-deflection-slot.js";

/** A rule a tiered deflection slot must pass. Check returns its problems, or none. */
export interface TieredDeflectionSlotRule {
  check(item: TieredDeflectionSlot): string[];
}

export class TieredDeflectionSlotCampaignRefLengthRule implements TieredDeflectionSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredDeflectionSlot): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredDeflectionSlotLabelLengthRule implements TieredDeflectionSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredDeflectionSlot): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredDeflectionSlotPriorityRangeRule implements TieredDeflectionSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredDeflectionSlot): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredDeflectionSlotExpiresAtRangeRule implements TieredDeflectionSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredDeflectionSlot): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredDeflectionSlotRequiredCodeRule implements TieredDeflectionSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredDeflectionSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredDeflectionSlotCodePrefixRule implements TieredDeflectionSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredDeflectionSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a tiered deflection slot. */
export class TieredDeflectionSlotValidator {
  rules: TieredDeflectionSlotRule[];

  constructor(rules: TieredDeflectionSlotRule[]) {
    this.rules = rules;
  }

  validate(item: TieredDeflectionSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredDeflectionSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredDeflectionSlot[]): Map<string, string[]> {
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

export function defaultTieredDeflectionSlotValidator(): TieredDeflectionSlotValidator {
  return new TieredDeflectionSlotValidator(
    [
      new TieredDeflectionSlotCampaignRefLengthRule(64),
      new TieredDeflectionSlotLabelLengthRule(255),
      new TieredDeflectionSlotPriorityRangeRule(16, 3600),
      new TieredDeflectionSlotExpiresAtRangeRule(64, 86400),
      new TieredDeflectionSlotRequiredCodeRule("tiered deflection slot needs this field"),
      new TieredDeflectionSlotCodePrefixRule("ACM"),
    ],
  );
}
