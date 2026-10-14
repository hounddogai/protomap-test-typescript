import { DefaultExitRuleForecast } from "./default-exit-rule-forecast.js";

/** A rule a default exit rule forecast must pass. Check returns its problems, or none. */
export interface DefaultExitRuleForecastRule {
  check(item: DefaultExitRuleForecast): string[];
}

export class DefaultExitRuleForecastRequiredCodeRule implements DefaultExitRuleForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultExitRuleForecast): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultExitRuleForecastTitleLengthRule implements DefaultExitRuleForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultExitRuleForecast): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultExitRuleForecastRequiredExternalRefRule implements DefaultExitRuleForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultExitRuleForecast): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultExitRuleForecastRequiredChannelRule implements DefaultExitRuleForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultExitRuleForecast): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default exit rule forecast. */
export class DefaultExitRuleForecastValidator {
  rules: DefaultExitRuleForecastRule[];

  constructor(rules: DefaultExitRuleForecastRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultExitRuleForecast): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultExitRuleForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultExitRuleForecast[]): Map<string, string[]> {
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

export function defaultDefaultExitRuleForecastValidator(): DefaultExitRuleForecastValidator {
  return new DefaultExitRuleForecastValidator(
    [
      new DefaultExitRuleForecastRequiredCodeRule("default exit rule forecast needs this field"),
      new DefaultExitRuleForecastTitleLengthRule(1000),
      new DefaultExitRuleForecastRequiredExternalRefRule("default exit rule forecast needs an entry"),
      new DefaultExitRuleForecastRequiredChannelRule("default exit rule forecast needs a value"),
    ],
  );
}
