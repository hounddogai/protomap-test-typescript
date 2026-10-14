import * as text from "../../../../kit/text.js";
import { RegionalWaitSnapshot } from "./regional-wait-snapshot.js";

/** A rule a regional wait snapshot must pass. Check returns its problems, or none. */
export interface RegionalWaitSnapshotRule {
  check(item: RegionalWaitSnapshot): string[];
}

export class RegionalWaitSnapshotDescriptionLengthRule implements RegionalWaitSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalWaitSnapshot): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalWaitSnapshotPriorityRangeRule implements RegionalWaitSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalWaitSnapshot): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalWaitSnapshotRequiredTitleRule implements RegionalWaitSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalWaitSnapshot): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalWaitSnapshotAllowedTitleRule implements RegionalWaitSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalWaitSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is above maximum`];
    return [];
  }
}

export class RegionalWaitSnapshotRequiredCodeRule implements RegionalWaitSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalWaitSnapshot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalWaitSnapshotTitleLengthRule implements RegionalWaitSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalWaitSnapshot): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional wait snapshot. */
export class RegionalWaitSnapshotValidator {
  rules: RegionalWaitSnapshotRule[];

  constructor(rules: RegionalWaitSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalWaitSnapshot): string[] {
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

  requireValid(item: RegionalWaitSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalWaitSnapshot[]): Map<string, string[]> {
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

export function defaultRegionalWaitSnapshotValidator(): RegionalWaitSnapshotValidator {
  return new RegionalWaitSnapshotValidator(
    [
      new RegionalWaitSnapshotDescriptionLengthRule(86400),
      new RegionalWaitSnapshotPriorityRangeRule(120, 255),
      new RegionalWaitSnapshotRequiredTitleRule("regional wait snapshot needs a value"),
      new RegionalWaitSnapshotAllowedTitleRule(["lenient"]),
      new RegionalWaitSnapshotRequiredCodeRule("regional wait snapshot needs a value"),
      new RegionalWaitSnapshotTitleLengthRule(86400),
    ],
  );
}
