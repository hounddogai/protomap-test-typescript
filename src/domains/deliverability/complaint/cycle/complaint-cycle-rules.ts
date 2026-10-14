import { ComplaintCycle } from "./complaint-cycle.js";

/** A rule a complaint cycle must pass. Check returns its problems, or none. */
export interface ComplaintCycleRule {
  check(item: ComplaintCycle): string[];
}

export class ComplaintCycleActiveGuardRule implements ComplaintCycleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ComplaintCycle): string[] {
    if (item.active && item.cost > this.limit) return [`cost ${item.cost} exceeds ${this.limit} while active`];
    return [];
  }
}

export class ComplaintCycleRequiredChannelRule implements ComplaintCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintCycle): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class ComplaintCycleRequiredLabelRule implements ComplaintCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintCycle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ComplaintCycleFloorValueRangeRule implements ComplaintCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ComplaintCycle): string[] {
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

/** Runs every rule of a complaint cycle. */
export class ComplaintCycleValidator {
  rules: ComplaintCycleRule[];

  constructor(rules: ComplaintCycleRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintCycle): string[] {
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

  requireValid(item: ComplaintCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintCycle[]): Map<string, string[]> {
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

export function defaultComplaintCycleValidator(): ComplaintCycleValidator {
  return new ComplaintCycleValidator(
    [
      new ComplaintCycleActiveGuardRule(6.2),
      new ComplaintCycleRequiredChannelRule("complaint cycle needs an entry"),
      new ComplaintCycleRequiredLabelRule("complaint cycle needs a value"),
      new ComplaintCycleFloorValueRangeRule(2.6, 3193.6),
    ],
  );
}
