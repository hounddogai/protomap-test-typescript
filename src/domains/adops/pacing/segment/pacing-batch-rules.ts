import { PacingBatch } from "./pacing-batch.js";

/** A rule a pacing batch must pass. Check returns its problems, or none. */
export interface PacingBatchRule {
  check(item: PacingBatch): string[];
}

export class PacingBatchCodePrefixRule implements PacingBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PacingBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PacingBatchRequiredSummaryRule implements PacingBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingBatch): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class PacingBatchRequiredNameRule implements PacingBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingBatch): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pacing batch. */
export class PacingBatchValidator {
  rules: PacingBatchRule[];

  constructor(rules: PacingBatchRule[]) {
    this.rules = rules;
  }

  validate(item: PacingBatch): string[] {
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

  requireValid(item: PacingBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingBatch[]): Map<string, string[]> {
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

export function defaultPacingBatchValidator(): PacingBatchValidator {
  return new PacingBatchValidator(
    [
      new PacingBatchCodePrefixRule("REF"),
      new PacingBatchRequiredSummaryRule("pacing batch needs a value"),
      new PacingBatchRequiredNameRule("pacing batch needs an entry"),
    ],
  );
}
