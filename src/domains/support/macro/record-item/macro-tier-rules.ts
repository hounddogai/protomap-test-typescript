import { MacroTier } from "./macro-tier.js";

/** A rule a macro tier must pass. Check returns its problems, or none. */
export interface MacroTierRule {
  check(item: MacroTier): string[];
}

export class MacroTierRequiredJourneyIdRule implements MacroTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroTier): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class MacroTierDiscountRangeRule implements MacroTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MacroTier): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class MacroTierBudgetRangeRule implements MacroTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MacroTier): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class MacroTierCodePrefixRule implements MacroTierRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: MacroTier): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a macro tier. */
export class MacroTierValidator {
  rules: MacroTierRule[];

  constructor(rules: MacroTierRule[]) {
    this.rules = rules;
  }

  validate(item: MacroTier): string[] {
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

  requireValid(item: MacroTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroTier[]): Map<string, string[]> {
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

export function defaultMacroTierValidator(): MacroTierValidator {
  return new MacroTierValidator(
    [
      new MacroTierRequiredJourneyIdRule("macro tier needs an entry"),
      new MacroTierDiscountRangeRule(1, 2436.3),
      new MacroTierBudgetRangeRule(9.4, 967.4),
      new MacroTierCodePrefixRule("REF"),
    ],
  );
}
