import { AdaptivePayoutSlot } from "./adaptive-payout-slot.js";

/** A rule a adaptive payout slot must pass. Check returns its problems, or none. */
export interface AdaptivePayoutSlotRule {
  check(item: AdaptivePayoutSlot): string[];
}

export class AdaptivePayoutSlotFloorValueRangeRule implements AdaptivePayoutSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptivePayoutSlot): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptivePayoutSlotRequiredExternalRefRule implements AdaptivePayoutSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptivePayoutSlot): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptivePayoutSlotCodePrefixRule implements AdaptivePayoutSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptivePayoutSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a adaptive payout slot. */
export class AdaptivePayoutSlotValidator {
  rules: AdaptivePayoutSlotRule[];

  constructor(rules: AdaptivePayoutSlotRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptivePayoutSlot): string[] {
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

  requireValid(item: AdaptivePayoutSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptivePayoutSlot[]): Map<string, string[]> {
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

export function defaultAdaptivePayoutSlotValidator(): AdaptivePayoutSlotValidator {
  return new AdaptivePayoutSlotValidator(
    [
      new AdaptivePayoutSlotFloorValueRangeRule(9.9, 2460),
      new AdaptivePayoutSlotRequiredExternalRefRule("adaptive payout slot needs a value"),
      new AdaptivePayoutSlotCodePrefixRule("X"),
    ],
  );
}
