import { LenientLevelThreshold } from "./lenient-level-threshold.js";

/** A rule a lenient level threshold must pass. Check returns its problems, or none. */
export interface LenientLevelThresholdRule {
  check(item: LenientLevelThreshold): string[];
}

export class LenientLevelThresholdRequiredCodeRule implements LenientLevelThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientLevelThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientLevelThresholdCodePrefixRule implements LenientLevelThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientLevelThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientLevelThresholdBudgetRangeRule implements LenientLevelThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientLevelThreshold): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientLevelThresholdRequiredDescriptionRule implements LenientLevelThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientLevelThreshold): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class LenientLevelThresholdRequiredAudienceIdRule implements LenientLevelThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientLevelThreshold): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient level threshold. */
export class LenientLevelThresholdValidator {
  rules: LenientLevelThresholdRule[];

  constructor(rules: LenientLevelThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: LenientLevelThreshold): string[] {
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

  requireValid(item: LenientLevelThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientLevelThreshold[]): Map<string, string[]> {
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

export function defaultLenientLevelThresholdValidator(): LenientLevelThresholdValidator {
  return new LenientLevelThresholdValidator(
    [
      new LenientLevelThresholdRequiredCodeRule("lenient level threshold needs an entry"),
      new LenientLevelThresholdCodePrefixRule("X"),
      new LenientLevelThresholdBudgetRangeRule(8.9, 4387.2),
      new LenientLevelThresholdRequiredDescriptionRule("lenient level threshold needs a value"),
      new LenientLevelThresholdRequiredAudienceIdRule("lenient level threshold needs a value"),
    ],
  );
}
