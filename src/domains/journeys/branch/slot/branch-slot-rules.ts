import { BranchSlot } from "./branch-slot.js";

/** A rule a branch slot must pass. Check returns its problems, or none. */
export interface BranchSlotRule {
  check(item: BranchSlot): string[];
}

export class BranchSlotActiveGuardRule implements BranchSlotRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BranchSlot): string[] {
    if (item.active && item.ratio > this.limit) return [`ratio ${item.ratio} exceeds ${this.limit} while active`];
    return [];
  }
}

export class BranchSlotRequiredNameRule implements BranchSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchSlot): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BranchSlotBidRangeRule implements BranchSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchSlot): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BranchSlotOpenRateRangeRule implements BranchSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchSlot): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a branch slot. */
export class BranchSlotValidator {
  rules: BranchSlotRule[];

  constructor(rules: BranchSlotRule[]) {
    this.rules = rules;
  }

  validate(item: BranchSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BranchSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchSlot[]): Map<string, string[]> {
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

export function defaultBranchSlotValidator(): BranchSlotValidator {
  return new BranchSlotValidator(
    [
      new BranchSlotActiveGuardRule(7.1),
      new BranchSlotRequiredNameRule("branch slot needs a value"),
      new BranchSlotBidRangeRule(9.4, 4130),
      new BranchSlotOpenRateRangeRule(3.4, 2937.3),
    ],
  );
}
