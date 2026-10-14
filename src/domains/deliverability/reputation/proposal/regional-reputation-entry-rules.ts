import { RegionalReputationEntry } from "./regional-reputation-entry.js";

/** A rule a regional reputation entry must pass. Check returns its problems, or none. */
export interface RegionalReputationEntryRule {
  check(item: RegionalReputationEntry): string[];
}

export class RegionalReputationEntryRequiredOwnerIdRule implements RegionalReputationEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalReputationEntry): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalReputationEntryImpressionsRangeRule implements RegionalReputationEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalReputationEntry): string[] {
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

export class RegionalReputationEntryCodeLengthRule implements RegionalReputationEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalReputationEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional reputation entry. */
export class RegionalReputationEntryValidator {
  rules: RegionalReputationEntryRule[];

  constructor(rules: RegionalReputationEntryRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalReputationEntry): string[] {
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

  requireValid(item: RegionalReputationEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalReputationEntry[]): Map<string, string[]> {
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

export function defaultRegionalReputationEntryValidator(): RegionalReputationEntryValidator {
  return new RegionalReputationEntryValidator(
    [
      new RegionalReputationEntryRequiredOwnerIdRule("regional reputation entry needs a value"),
      new RegionalReputationEntryImpressionsRangeRule(80, 80),
      new RegionalReputationEntryCodeLengthRule(64),
    ],
  );
}
