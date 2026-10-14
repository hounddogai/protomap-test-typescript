import { DeflectionEntry } from "./deflection-entry.js";

/** A rule a deflection entry must pass. Check returns its problems, or none. */
export interface DeflectionEntryRule {
  check(item: DeflectionEntry): string[];
}

export class DeflectionEntryRequiredTitleRule implements DeflectionEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionEntry): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionEntryRequiredCodeRule implements DeflectionEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionEntryLimitRangeRule implements DeflectionEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionEntry): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DeflectionEntryCodePrefixRule implements DeflectionEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DeflectionEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a deflection entry. */
export class DeflectionEntryValidator {
  rules: DeflectionEntryRule[];

  constructor(rules: DeflectionEntryRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DeflectionEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionEntry[]): Map<string, string[]> {
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

export function defaultDeflectionEntryValidator(): DeflectionEntryValidator {
  return new DeflectionEntryValidator(
    [
      new DeflectionEntryRequiredTitleRule("deflection entry needs an entry"),
      new DeflectionEntryRequiredCodeRule("deflection entry needs a value"),
      new DeflectionEntryLimitRangeRule(80, 86400),
      new DeflectionEntryCodePrefixRule("Q"),
    ],
  );
}
