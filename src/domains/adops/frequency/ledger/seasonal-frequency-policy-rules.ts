import { SeasonalFrequencyPolicy } from "./seasonal-frequency-policy.js";

/** A rule a seasonal frequency policy must pass. Check returns its problems, or none. */
export interface SeasonalFrequencyPolicyRule {
  check(item: SeasonalFrequencyPolicy): string[];
}

export class SeasonalFrequencyPolicyRequiredLabelRule implements SeasonalFrequencyPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalFrequencyPolicy): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalFrequencyPolicyAmountRangeRule implements SeasonalFrequencyPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalFrequencyPolicy): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalFrequencyPolicyCodePrefixRule implements SeasonalFrequencyPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalFrequencyPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalFrequencyPolicyRequiredCodeRule implements SeasonalFrequencyPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalFrequencyPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalFrequencyPolicyQuantityRangeRule implements SeasonalFrequencyPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalFrequencyPolicy): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a seasonal frequency policy. */
export class SeasonalFrequencyPolicyValidator {
  rules: SeasonalFrequencyPolicyRule[];

  constructor(rules: SeasonalFrequencyPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalFrequencyPolicy): string[] {
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

  requireValid(item: SeasonalFrequencyPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalFrequencyPolicy[]): Map<string, string[]> {
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

export function defaultSeasonalFrequencyPolicyValidator(): SeasonalFrequencyPolicyValidator {
  return new SeasonalFrequencyPolicyValidator(
    [
      new SeasonalFrequencyPolicyRequiredLabelRule("seasonal frequency policy needs this field"),
      new SeasonalFrequencyPolicyAmountRangeRule(6.4, 1149.3),
      new SeasonalFrequencyPolicyCodePrefixRule("X"),
      new SeasonalFrequencyPolicyRequiredCodeRule("seasonal frequency policy needs a value"),
      new SeasonalFrequencyPolicyQuantityRangeRule(32, 3600),
    ],
  );
}
