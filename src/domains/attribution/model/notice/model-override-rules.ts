import { ModelOverride } from "./model-override.js";

/** A rule a model override must pass. Check returns its problems, or none. */
export interface ModelOverrideRule {
  check(item: ModelOverride): string[];
}

export class ModelOverrideCodePrefixRule implements ModelOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ModelOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ModelOverrideDurationMinutesRangeRule implements ModelOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelOverride): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ModelOverrideAmountRangeRule implements ModelOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ModelOverride): string[] {
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

export class ModelOverrideActiveGuardRule implements ModelOverrideRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ModelOverride): string[] {
    if (item.active && item.attempts > this.limit) return [`attempts ${item.attempts} exceeds ${this.limit} while active`];
    return [];
  }
}

export class ModelOverrideTitleLengthRule implements ModelOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ModelOverride): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a model override. */
export class ModelOverrideValidator {
  rules: ModelOverrideRule[];

  constructor(rules: ModelOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: ModelOverride): string[] {
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

  requireValid(item: ModelOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ModelOverride[]): Map<string, string[]> {
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

export function defaultModelOverrideValidator(): ModelOverrideValidator {
  return new ModelOverrideValidator(
    [
      new ModelOverrideCodePrefixRule("OPS"),
      new ModelOverrideDurationMinutesRangeRule(32, 3600),
      new ModelOverrideAmountRangeRule(3.1, 1203.8),
      new ModelOverrideActiveGuardRule(86400),
      new ModelOverrideTitleLengthRule(80),
    ],
  );
}
