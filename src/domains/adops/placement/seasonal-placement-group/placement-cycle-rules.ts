import { PlacementCycle } from "./placement-cycle.js";

/** A rule a placement cycle must pass. Check returns its problems, or none. */
export interface PlacementCycleRule {
  check(item: PlacementCycle): string[];
}

export class PlacementCycleRequiredCodeRule implements PlacementCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementCycleUtmSourceLengthRule implements PlacementCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementCycle): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementCycleRevisionRangeRule implements PlacementCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementCycle): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a placement cycle. */
export class PlacementCycleValidator {
  rules: PlacementCycleRule[];

  constructor(rules: PlacementCycleRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementCycle): string[] {
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

  requireValid(item: PlacementCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementCycle[]): Map<string, string[]> {
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

export function defaultPlacementCycleValidator(): PlacementCycleValidator {
  return new PlacementCycleValidator(
    [
      new PlacementCycleRequiredCodeRule("placement cycle needs this field"),
      new PlacementCycleUtmSourceLengthRule(80),
      new PlacementCycleRevisionRangeRule(64, 3600),
    ],
  );
}
