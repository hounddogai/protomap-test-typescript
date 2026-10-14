import { RegionalPlacementEntry } from "./regional-placement-entry.js";

/** A rule a regional placement entry must pass. Check returns its problems, or none. */
export interface RegionalPlacementEntryRule {
  check(item: RegionalPlacementEntry): string[];
}

export class RegionalPlacementEntryCodeLengthRule implements RegionalPlacementEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalPlacementEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalPlacementEntryCodePrefixRule implements RegionalPlacementEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalPlacementEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalPlacementEntryOpenRateRangeRule implements RegionalPlacementEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalPlacementEntry): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalPlacementEntryWeightRangeRule implements RegionalPlacementEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalPlacementEntry): string[] {
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

export class RegionalPlacementEntryTitleLengthRule implements RegionalPlacementEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalPlacementEntry): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalPlacementEntryRequiredCodeRule implements RegionalPlacementEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalPlacementEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional placement entry. */
export class RegionalPlacementEntryValidator {
  rules: RegionalPlacementEntryRule[];

  constructor(rules: RegionalPlacementEntryRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalPlacementEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalPlacementEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalPlacementEntry[]): Map<string, string[]> {
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

export function defaultRegionalPlacementEntryValidator(): RegionalPlacementEntryValidator {
  return new RegionalPlacementEntryValidator(
    [
      new RegionalPlacementEntryCodeLengthRule(3600),
      new RegionalPlacementEntryCodePrefixRule("OPS"),
      new RegionalPlacementEntryOpenRateRangeRule(3.3, 1053.7),
      new RegionalPlacementEntryWeightRangeRule(1.7, 926.5),
      new RegionalPlacementEntryTitleLengthRule(120),
      new RegionalPlacementEntryRequiredCodeRule("regional placement entry needs this field"),
    ],
  );
}
