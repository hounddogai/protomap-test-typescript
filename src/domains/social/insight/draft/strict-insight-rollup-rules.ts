import { StrictInsightRollup } from "./strict-insight-rollup.js";

/** A rule a strict insight rollup must pass. Check returns its problems, or none. */
export interface StrictInsightRollupRule {
  check(item: StrictInsightRollup): string[];
}

export class StrictInsightRollupRequiredAudienceIdRule implements StrictInsightRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictInsightRollup): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class StrictInsightRollupRequiredCodeRule implements StrictInsightRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictInsightRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictInsightRollupCodeLengthRule implements StrictInsightRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictInsightRollup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict insight rollup. */
export class StrictInsightRollupValidator {
  rules: StrictInsightRollupRule[];

  constructor(rules: StrictInsightRollupRule[]) {
    this.rules = rules;
  }

  validate(item: StrictInsightRollup): string[] {
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

  requireValid(item: StrictInsightRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictInsightRollup[]): Map<string, string[]> {
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

export function defaultStrictInsightRollupValidator(): StrictInsightRollupValidator {
  return new StrictInsightRollupValidator(
    [
      new StrictInsightRollupRequiredAudienceIdRule("strict insight rollup needs an entry"),
      new StrictInsightRollupRequiredCodeRule("strict insight rollup needs an entry"),
      new StrictInsightRollupCodeLengthRule(255),
    ],
  );
}
