import { RegionalCreativeEntry } from "./regional-creative-entry.js";

/** A rule a regional creative entry must pass. Check returns its problems, or none. */
export interface RegionalCreativeEntryRule {
  check(item: RegionalCreativeEntry): string[];
}

export class RegionalCreativeEntryScoreRangeRule implements RegionalCreativeEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalCreativeEntry): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalCreativeEntryRequiredUtmSourceRule implements RegionalCreativeEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalCreativeEntry): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalCreativeEntryRequiredRegionRule implements RegionalCreativeEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalCreativeEntry): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalCreativeEntryPriorityRangeRule implements RegionalCreativeEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalCreativeEntry): string[] {
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

/** Runs every rule of a regional creative entry. */
export class RegionalCreativeEntryValidator {
  rules: RegionalCreativeEntryRule[];

  constructor(rules: RegionalCreativeEntryRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalCreativeEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalCreativeEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalCreativeEntry[]): Map<string, string[]> {
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

export function defaultRegionalCreativeEntryValidator(): RegionalCreativeEntryValidator {
  return new RegionalCreativeEntryValidator(
    [
      new RegionalCreativeEntryScoreRangeRule(5.7, 1591.7),
      new RegionalCreativeEntryRequiredUtmSourceRule("regional creative entry needs this field"),
      new RegionalCreativeEntryRequiredRegionRule("regional creative entry needs this field"),
      new RegionalCreativeEntryPriorityRangeRule(32, 255),
    ],
  );
}
