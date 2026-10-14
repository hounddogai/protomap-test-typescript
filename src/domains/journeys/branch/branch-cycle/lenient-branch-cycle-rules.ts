import { LenientBranchCycle } from "./lenient-branch-cycle.js";

/** A rule a lenient branch cycle must pass. Check returns its problems, or none. */
export interface LenientBranchCycleRule {
  check(item: LenientBranchCycle): string[];
}

export class LenientBranchCycleRequiredCodeRule implements LenientBranchCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientBranchCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientBranchCycleRequiredNameRule implements LenientBranchCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientBranchCycle): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LenientBranchCycleApprovedGuardRule implements LenientBranchCycleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LenientBranchCycle): string[] {
    if (item.approved && item.sequence > this.limit) return [`sequence ${item.sequence} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class LenientBranchCycleClicksRangeRule implements LenientBranchCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientBranchCycle): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a lenient branch cycle. */
export class LenientBranchCycleValidator {
  rules: LenientBranchCycleRule[];

  constructor(rules: LenientBranchCycleRule[]) {
    this.rules = rules;
  }

  validate(item: LenientBranchCycle): string[] {
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

  requireValid(item: LenientBranchCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientBranchCycle[]): Map<string, string[]> {
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

export function defaultLenientBranchCycleValidator(): LenientBranchCycleValidator {
  return new LenientBranchCycleValidator(
    [
      new LenientBranchCycleRequiredCodeRule("lenient branch cycle needs a value"),
      new LenientBranchCycleRequiredNameRule("lenient branch cycle needs this field"),
      new LenientBranchCycleApprovedGuardRule(255),
      new LenientBranchCycleClicksRangeRule(64, 255),
    ],
  );
}
