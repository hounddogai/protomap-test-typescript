import { GlobalBranchCycle } from "./global-branch-cycle.js";

/** A rule a global branch cycle must pass. Check returns its problems, or none. */
export interface GlobalBranchCycleRule {
  check(item: GlobalBranchCycle): string[];
}

export class GlobalBranchCycleCodePrefixRule implements GlobalBranchCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalBranchCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalBranchCycleDurationMinutesRangeRule implements GlobalBranchCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalBranchCycle): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalBranchCycleRequiredLabelRule implements GlobalBranchCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalBranchCycle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalBranchCycleWeightRangeRule implements GlobalBranchCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalBranchCycle): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a global branch cycle. */
export class GlobalBranchCycleValidator {
  rules: GlobalBranchCycleRule[];

  constructor(rules: GlobalBranchCycleRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalBranchCycle): string[] {
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

  requireValid(item: GlobalBranchCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalBranchCycle[]): Map<string, string[]> {
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

export function defaultGlobalBranchCycleValidator(): GlobalBranchCycleValidator {
  return new GlobalBranchCycleValidator(
    [
      new GlobalBranchCycleCodePrefixRule("Q"),
      new GlobalBranchCycleDurationMinutesRangeRule(120, 86400),
      new GlobalBranchCycleRequiredLabelRule("global branch cycle needs a value"),
      new GlobalBranchCycleWeightRangeRule(2.2, 3117),
    ],
  );
}
