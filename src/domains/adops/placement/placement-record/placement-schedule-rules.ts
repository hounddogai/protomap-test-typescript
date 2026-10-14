import { PlacementSchedule } from "./placement-schedule.js";

/** A rule a placement schedule must pass. Check returns its problems, or none. */
export interface PlacementScheduleRule {
  check(item: PlacementSchedule): string[];
}

export class PlacementScheduleRetriesRangeRule implements PlacementScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementSchedule): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PlacementScheduleRevisionRangeRule implements PlacementScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementSchedule): string[] {
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

export class PlacementScheduleTitleLengthRule implements PlacementScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementSchedule): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementScheduleCodeLengthRule implements PlacementScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementSchedule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementScheduleImpressionsRangeRule implements PlacementScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementSchedule): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PlacementScheduleRegionLengthRule implements PlacementScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementSchedule): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a placement schedule. */
export class PlacementScheduleValidator {
  rules: PlacementScheduleRule[];

  constructor(rules: PlacementScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementSchedule): string[] {
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

  requireValid(item: PlacementSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementSchedule[]): Map<string, string[]> {
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

export function defaultPlacementScheduleValidator(): PlacementScheduleValidator {
  return new PlacementScheduleValidator(
    [
      new PlacementScheduleRetriesRangeRule(120, 1000),
      new PlacementScheduleRevisionRangeRule(1000, 86400),
      new PlacementScheduleTitleLengthRule(255),
      new PlacementScheduleCodeLengthRule(32),
      new PlacementScheduleImpressionsRangeRule(16, 32),
      new PlacementScheduleRegionLengthRule(86400),
    ],
  );
}
