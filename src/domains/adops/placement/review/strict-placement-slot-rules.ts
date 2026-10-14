import { StrictPlacementSlot } from "./strict-placement-slot.js";

/** A rule a strict placement slot must pass. Check returns its problems, or none. */
export interface StrictPlacementSlotRule {
  check(item: StrictPlacementSlot): string[];
}

export class StrictPlacementSlotRequiredCodeRule implements StrictPlacementSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictPlacementSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictPlacementSlotBudgetRangeRule implements StrictPlacementSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictPlacementSlot): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictPlacementSlotSummaryLengthRule implements StrictPlacementSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictPlacementSlot): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictPlacementSlotRequiredNameRule implements StrictPlacementSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictPlacementSlot): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class StrictPlacementSlotCampaignRefLengthRule implements StrictPlacementSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictPlacementSlot): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictPlacementSlotCodePrefixRule implements StrictPlacementSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictPlacementSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a strict placement slot. */
export class StrictPlacementSlotValidator {
  rules: StrictPlacementSlotRule[];

  constructor(rules: StrictPlacementSlotRule[]) {
    this.rules = rules;
  }

  validate(item: StrictPlacementSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictPlacementSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictPlacementSlot[]): Map<string, string[]> {
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

export function defaultStrictPlacementSlotValidator(): StrictPlacementSlotValidator {
  return new StrictPlacementSlotValidator(
    [
      new StrictPlacementSlotRequiredCodeRule("strict placement slot needs a value"),
      new StrictPlacementSlotBudgetRangeRule(0, 2871.7),
      new StrictPlacementSlotSummaryLengthRule(255),
      new StrictPlacementSlotRequiredNameRule("strict placement slot needs a value"),
      new StrictPlacementSlotCampaignRefLengthRule(80),
      new StrictPlacementSlotCodePrefixRule("REF"),
    ],
  );
}
