import { PendingJourneyRollup } from "./pending-journey-rollup.js";

/** A rule a pending journey rollup must pass. Check returns its problems, or none. */
export interface PendingJourneyRollupRule {
  check(item: PendingJourneyRollup): string[];
}

export class PendingJourneyRollupCreatedAtRangeRule implements PendingJourneyRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingJourneyRollup): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingJourneyRollupRequiredNameRule implements PendingJourneyRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingJourneyRollup): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PendingJourneyRollupCodePrefixRule implements PendingJourneyRollupRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingJourneyRollup): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a pending journey rollup. */
export class PendingJourneyRollupValidator {
  rules: PendingJourneyRollupRule[];

  constructor(rules: PendingJourneyRollupRule[]) {
    this.rules = rules;
  }

  validate(item: PendingJourneyRollup): string[] {
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

  requireValid(item: PendingJourneyRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingJourneyRollup[]): Map<string, string[]> {
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

export function defaultPendingJourneyRollupValidator(): PendingJourneyRollupValidator {
  return new PendingJourneyRollupValidator(
    [
      new PendingJourneyRollupCreatedAtRangeRule(16, 86400),
      new PendingJourneyRollupRequiredNameRule("pending journey rollup needs an entry"),
      new PendingJourneyRollupCodePrefixRule("REF"),
    ],
  );
}
