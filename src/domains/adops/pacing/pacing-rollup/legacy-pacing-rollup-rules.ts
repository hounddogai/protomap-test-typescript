import { LegacyPacingRollup } from "./legacy-pacing-rollup.js";

/** A rule a legacy pacing rollup must pass. Check returns its problems, or none. */
export interface LegacyPacingRollupRule {
  check(item: LegacyPacingRollup): string[];
}

export class LegacyPacingRollupCategoryLengthRule implements LegacyPacingRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyPacingRollup): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyPacingRollupRequiredCategoryRule implements LegacyPacingRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyPacingRollup): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyPacingRollupRequiredLabelRule implements LegacyPacingRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyPacingRollup): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyPacingRollupArchivedGuardRule implements LegacyPacingRollupRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LegacyPacingRollup): string[] {
    if (item.archived && item.bid > this.limit) return [`bid ${item.bid} exceeds ${this.limit} while archived`];
    return [];
  }
}

/** Runs every rule of a legacy pacing rollup. */
export class LegacyPacingRollupValidator {
  rules: LegacyPacingRollupRule[];

  constructor(rules: LegacyPacingRollupRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyPacingRollup): string[] {
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

  requireValid(item: LegacyPacingRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyPacingRollup[]): Map<string, string[]> {
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

export function defaultLegacyPacingRollupValidator(): LegacyPacingRollupValidator {
  return new LegacyPacingRollupValidator(
    [
      new LegacyPacingRollupCategoryLengthRule(64),
      new LegacyPacingRollupRequiredCategoryRule("legacy pacing rollup needs this field"),
      new LegacyPacingRollupRequiredLabelRule("legacy pacing rollup needs a value"),
      new LegacyPacingRollupArchivedGuardRule(1),
    ],
  );
}
