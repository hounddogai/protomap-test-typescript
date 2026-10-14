import { RegionalModelEntry } from "./regional-model-entry.js";

/** A rule a regional model entry must pass. Check returns its problems, or none. */
export interface RegionalModelEntryRule {
  check(item: RegionalModelEntry): string[];
}

export class RegionalModelEntryWindowDaysRangeRule implements RegionalModelEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalModelEntry): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalModelEntryQuantityRangeRule implements RegionalModelEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalModelEntry): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalModelEntryCodePrefixRule implements RegionalModelEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalModelEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a regional model entry. */
export class RegionalModelEntryValidator {
  rules: RegionalModelEntryRule[];

  constructor(rules: RegionalModelEntryRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalModelEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalModelEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalModelEntry[]): Map<string, string[]> {
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

export function defaultRegionalModelEntryValidator(): RegionalModelEntryValidator {
  return new RegionalModelEntryValidator(
    [
      new RegionalModelEntryWindowDaysRangeRule(120, 255),
      new RegionalModelEntryQuantityRangeRule(32, 255),
      new RegionalModelEntryCodePrefixRule("OPS"),
    ],
  );
}
