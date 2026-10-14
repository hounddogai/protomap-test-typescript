import { SeasonalDomainGroup } from "./seasonal-domain-group.js";

/** A rule a seasonal domain group must pass. Check returns its problems, or none. */
export interface SeasonalDomainGroupRule {
  check(item: SeasonalDomainGroup): string[];
}

export class SeasonalDomainGroupRequiredCurrencyRule implements SeasonalDomainGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalDomainGroup): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalDomainGroupAmountRangeRule implements SeasonalDomainGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalDomainGroup): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalDomainGroupMarginRangeRule implements SeasonalDomainGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalDomainGroup): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalDomainGroupTitleLengthRule implements SeasonalDomainGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalDomainGroup): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalDomainGroupCurrencyLengthRule implements SeasonalDomainGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalDomainGroup): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal domain group. */
export class SeasonalDomainGroupValidator {
  rules: SeasonalDomainGroupRule[];

  constructor(rules: SeasonalDomainGroupRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalDomainGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalDomainGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalDomainGroup[]): Map<string, string[]> {
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

export function defaultSeasonalDomainGroupValidator(): SeasonalDomainGroupValidator {
  return new SeasonalDomainGroupValidator(
    [
      new SeasonalDomainGroupRequiredCurrencyRule("seasonal domain group needs a value"),
      new SeasonalDomainGroupAmountRangeRule(0.9, 4208.8),
      new SeasonalDomainGroupMarginRangeRule(6.3, 4691.5),
      new SeasonalDomainGroupTitleLengthRule(120),
      new SeasonalDomainGroupCurrencyLengthRule(255),
    ],
  );
}
