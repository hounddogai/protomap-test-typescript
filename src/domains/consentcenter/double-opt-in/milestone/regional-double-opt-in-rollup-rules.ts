import { RegionalDoubleOptInRollup } from "./regional-double-opt-in-rollup.js";

/** A rule a regional double opt in rollup must pass. Check returns its problems, or none. */
export interface RegionalDoubleOptInRollupRule {
  check(item: RegionalDoubleOptInRollup): string[];
}

export class RegionalDoubleOptInRollupRequiredCodeRule implements RegionalDoubleOptInRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalDoubleOptInRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalDoubleOptInRollupTitleLengthRule implements RegionalDoubleOptInRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalDoubleOptInRollup): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalDoubleOptInRollupRequiredTitleRule implements RegionalDoubleOptInRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalDoubleOptInRollup): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional double opt in rollup. */
export class RegionalDoubleOptInRollupValidator {
  rules: RegionalDoubleOptInRollupRule[];

  constructor(rules: RegionalDoubleOptInRollupRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalDoubleOptInRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalDoubleOptInRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalDoubleOptInRollup[]): Map<string, string[]> {
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

export function defaultRegionalDoubleOptInRollupValidator(): RegionalDoubleOptInRollupValidator {
  return new RegionalDoubleOptInRollupValidator(
    [
      new RegionalDoubleOptInRollupRequiredCodeRule("regional double opt in rollup needs this field"),
      new RegionalDoubleOptInRollupTitleLengthRule(3600),
      new RegionalDoubleOptInRollupRequiredTitleRule("regional double opt in rollup needs this field"),
    ],
  );
}
