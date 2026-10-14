import { InsightRollup } from "./insight-rollup.js";

/** A rule a insight rollup must pass. Check returns its problems, or none. */
export interface InsightRollupRule {
  check(item: InsightRollup): string[];
}

export class InsightRollupChecksumLengthRule implements InsightRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightRollup): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightRollupRequiredNotesRule implements InsightRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightRollup): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class InsightRollupNameLengthRule implements InsightRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightRollup): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a insight rollup. */
export class InsightRollupValidator {
  rules: InsightRollupRule[];

  constructor(rules: InsightRollupRule[]) {
    this.rules = rules;
  }

  validate(item: InsightRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InsightRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightRollup[]): Map<string, string[]> {
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

export function defaultInsightRollupValidator(): InsightRollupValidator {
  return new InsightRollupValidator(
    [
      new InsightRollupChecksumLengthRule(16),
      new InsightRollupRequiredNotesRule("insight rollup needs this field"),
      new InsightRollupNameLengthRule(86400),
    ],
  );
}
