import * as text from "../../../../kit/text.js";
import { WindowSnapshot } from "./window-snapshot.js";

/** A rule a window snapshot must pass. Check returns its problems, or none. */
export interface WindowSnapshotRule {
  check(item: WindowSnapshot): string[];
}

export class WindowSnapshotCostRangeRule implements WindowSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowSnapshot): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WindowSnapshotConversionRateRangeRule implements WindowSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowSnapshot): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WindowSnapshotRevisionRangeRule implements WindowSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowSnapshot): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WindowSnapshotContactEmailLengthRule implements WindowSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowSnapshot): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowSnapshotAllowedContactEmailRule implements WindowSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WindowSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is too long`];
    return [];
  }
}

/** Runs every rule of a window snapshot. */
export class WindowSnapshotValidator {
  rules: WindowSnapshotRule[];

  constructor(rules: WindowSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: WindowSnapshot): string[] {
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

  requireValid(item: WindowSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowSnapshot[]): Map<string, string[]> {
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

export function defaultWindowSnapshotValidator(): WindowSnapshotValidator {
  return new WindowSnapshotValidator(
    [
      new WindowSnapshotCostRangeRule(6.5, 2409.1),
      new WindowSnapshotConversionRateRangeRule(1.2, 2593.9),
      new WindowSnapshotRevisionRangeRule(64, 86400),
      new WindowSnapshotContactEmailLengthRule(3600),
      new WindowSnapshotAllowedContactEmailRule(["regional"]),
    ],
  );
}
