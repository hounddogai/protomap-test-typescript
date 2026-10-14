import { RewardRuleForecast } from "./reward-rule-forecast.js";

/** A rule a reward rule forecast must pass. Check returns its problems, or none. */
export interface RewardRuleForecastRule {
  check(item: RewardRuleForecast): string[];
}

export class RewardRuleForecastDescriptionLengthRule implements RewardRuleForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleForecast): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleForecastLabelLengthRule implements RewardRuleForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleForecast): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleForecastRequiredCodeRule implements RewardRuleForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleForecast): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleForecastRequiredUtmSourceRule implements RewardRuleForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleForecast): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleForecastCodePrefixRule implements RewardRuleForecastRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RewardRuleForecast): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RewardRuleForecastUtmSourceLengthRule implements RewardRuleForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleForecast): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reward rule forecast. */
export class RewardRuleForecastValidator {
  rules: RewardRuleForecastRule[];

  constructor(rules: RewardRuleForecastRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardRuleForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleForecast[]): Map<string, string[]> {
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

export function defaultRewardRuleForecastValidator(): RewardRuleForecastValidator {
  return new RewardRuleForecastValidator(
    [
      new RewardRuleForecastDescriptionLengthRule(16),
      new RewardRuleForecastLabelLengthRule(86400),
      new RewardRuleForecastRequiredCodeRule("reward rule forecast needs this field"),
      new RewardRuleForecastRequiredUtmSourceRule("reward rule forecast needs a value"),
      new RewardRuleForecastCodePrefixRule("ACM"),
      new RewardRuleForecastUtmSourceLengthRule(255),
    ],
  );
}
