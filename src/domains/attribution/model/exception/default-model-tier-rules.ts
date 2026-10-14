import { DefaultModelTier } from "./default-model-tier.js";

/** A rule a default model tier must pass. Check returns its problems, or none. */
export interface DefaultModelTierRule {
  check(item: DefaultModelTier): string[];
}

export class DefaultModelTierRequiredCurrencyRule implements DefaultModelTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultModelTier): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultModelTierFrequencyCapRangeRule implements DefaultModelTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultModelTier): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultModelTierCreatedAtRangeRule implements DefaultModelTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultModelTier): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultModelTierPriorityRangeRule implements DefaultModelTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultModelTier): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a default model tier. */
export class DefaultModelTierValidator {
  rules: DefaultModelTierRule[];

  constructor(rules: DefaultModelTierRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultModelTier): string[] {
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

  requireValid(item: DefaultModelTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultModelTier[]): Map<string, string[]> {
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

export function defaultDefaultModelTierValidator(): DefaultModelTierValidator {
  return new DefaultModelTierValidator(
    [
      new DefaultModelTierRequiredCurrencyRule("default model tier needs a value"),
      new DefaultModelTierFrequencyCapRangeRule(80, 80),
      new DefaultModelTierCreatedAtRangeRule(80, 86400),
      new DefaultModelTierPriorityRangeRule(80, 3600),
    ],
  );
}
