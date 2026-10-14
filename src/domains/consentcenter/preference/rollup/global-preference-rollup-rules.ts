import { GlobalPreferenceRollup } from "./global-preference-rollup.js";

/** A rule a global preference rollup must pass. Check returns its problems, or none. */
export interface GlobalPreferenceRollupRule {
  check(item: GlobalPreferenceRollup): string[];
}

export class GlobalPreferenceRollupSequenceRangeRule implements GlobalPreferenceRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalPreferenceRollup): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalPreferenceRollupRequiredSegmentRule implements GlobalPreferenceRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalPreferenceRollup): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalPreferenceRollupRequiredNameRule implements GlobalPreferenceRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalPreferenceRollup): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global preference rollup. */
export class GlobalPreferenceRollupValidator {
  rules: GlobalPreferenceRollupRule[];

  constructor(rules: GlobalPreferenceRollupRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalPreferenceRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalPreferenceRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalPreferenceRollup[]): Map<string, string[]> {
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

export function defaultGlobalPreferenceRollupValidator(): GlobalPreferenceRollupValidator {
  return new GlobalPreferenceRollupValidator(
    [
      new GlobalPreferenceRollupSequenceRangeRule(16, 255),
      new GlobalPreferenceRollupRequiredSegmentRule("global preference rollup needs a value"),
      new GlobalPreferenceRollupRequiredNameRule("global preference rollup needs an entry"),
    ],
  );
}
