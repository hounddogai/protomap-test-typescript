import * as text from "../../../../kit/text.js";
import { RegionalCreativeRecord } from "./regional-creative-record.js";

/** A rule a regional creative record must pass. Check returns its problems, or none. */
export interface RegionalCreativeRecordRule {
  check(item: RegionalCreativeRecord): string[];
}

export class RegionalCreativeRecordAllowedContactEmailRule implements RegionalCreativeRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalCreativeRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is missing`];
    return [];
  }
}

export class RegionalCreativeRecordRateRangeRule implements RegionalCreativeRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalCreativeRecord): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalCreativeRecordRatioRangeRule implements RegionalCreativeRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalCreativeRecord): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalCreativeRecordRequiredLocaleRule implements RegionalCreativeRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalCreativeRecord): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalCreativeRecordRequiredCodeRule implements RegionalCreativeRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalCreativeRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional creative record. */
export class RegionalCreativeRecordValidator {
  rules: RegionalCreativeRecordRule[];

  constructor(rules: RegionalCreativeRecordRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalCreativeRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalCreativeRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalCreativeRecord[]): Map<string, string[]> {
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

export function defaultRegionalCreativeRecordValidator(): RegionalCreativeRecordValidator {
  return new RegionalCreativeRecordValidator(
    [
      new RegionalCreativeRecordAllowedContactEmailRule(["legacy", "weighted", "lenient"]),
      new RegionalCreativeRecordRateRangeRule(6.8, 2325.4),
      new RegionalCreativeRecordRatioRangeRule(5.1, 2460.9),
      new RegionalCreativeRecordRequiredLocaleRule("regional creative record needs this field"),
      new RegionalCreativeRecordRequiredCodeRule("regional creative record needs a value"),
    ],
  );
}
