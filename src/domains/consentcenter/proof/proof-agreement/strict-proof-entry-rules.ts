import { StrictProofEntry } from "./strict-proof-entry.js";

/** A rule a strict proof entry must pass. Check returns its problems, or none. */
export interface StrictProofEntryRule {
  check(item: StrictProofEntry): string[];
}

export class StrictProofEntryRequiredJourneyIdRule implements StrictProofEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictProofEntry): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class StrictProofEntryAmountRangeRule implements StrictProofEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictProofEntry): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictProofEntryRequiredCodeRule implements StrictProofEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictProofEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict proof entry. */
export class StrictProofEntryValidator {
  rules: StrictProofEntryRule[];

  constructor(rules: StrictProofEntryRule[]) {
    this.rules = rules;
  }

  validate(item: StrictProofEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictProofEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictProofEntry[]): Map<string, string[]> {
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

export function defaultStrictProofEntryValidator(): StrictProofEntryValidator {
  return new StrictProofEntryValidator(
    [
      new StrictProofEntryRequiredJourneyIdRule("strict proof entry needs this field"),
      new StrictProofEntryAmountRangeRule(9.1, 1234),
      new StrictProofEntryRequiredCodeRule("strict proof entry needs an entry"),
    ],
  );
}
