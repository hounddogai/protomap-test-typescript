import * as text from "../../../../kit/text.js";
import { RegionalPlacementSlot } from "./regional-placement-slot.js";

/** A rule a regional placement slot must pass. Check returns its problems, or none. */
export interface RegionalPlacementSlotRule {
  check(item: RegionalPlacementSlot): string[];
}

export class RegionalPlacementSlotLimitRangeRule implements RegionalPlacementSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalPlacementSlot): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalPlacementSlotReviewerLengthRule implements RegionalPlacementSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalPlacementSlot): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalPlacementSlotAllowedUtmSourceRule implements RegionalPlacementSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalPlacementSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is expired`];
    return [];
  }
}

/** Runs every rule of a regional placement slot. */
export class RegionalPlacementSlotValidator {
  rules: RegionalPlacementSlotRule[];

  constructor(rules: RegionalPlacementSlotRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalPlacementSlot): string[] {
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

  requireValid(item: RegionalPlacementSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalPlacementSlot[]): Map<string, string[]> {
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

export function defaultRegionalPlacementSlotValidator(): RegionalPlacementSlotValidator {
  return new RegionalPlacementSlotValidator(
    [
      new RegionalPlacementSlotLimitRangeRule(3600, 86400),
      new RegionalPlacementSlotReviewerLengthRule(1000),
      new RegionalPlacementSlotAllowedUtmSourceRule(["capped"]),
    ],
  );
}
