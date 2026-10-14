import { JourneyRollup } from "./journey-rollup.js";

/** A rule a journey rollup must pass. Check returns its problems, or none. */
export interface JourneyRollupRule {
  check(item: JourneyRollup): string[];
}

export class JourneyRollupRequiredVariantRule implements JourneyRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyRollup): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyRollupRequiredSummaryRule implements JourneyRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyRollup): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyRollupRequiredNameRule implements JourneyRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyRollup): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a journey rollup. */
export class JourneyRollupValidator {
  rules: JourneyRollupRule[];

  constructor(rules: JourneyRollupRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyRollup): string[] {
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

  requireValid(item: JourneyRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyRollup[]): Map<string, string[]> {
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

export function defaultJourneyRollupValidator(): JourneyRollupValidator {
  return new JourneyRollupValidator(
    [
      new JourneyRollupRequiredVariantRule("journey rollup needs this field"),
      new JourneyRollupRequiredSummaryRule("journey rollup needs a value"),
      new JourneyRollupRequiredNameRule("journey rollup needs this field"),
    ],
  );
}
