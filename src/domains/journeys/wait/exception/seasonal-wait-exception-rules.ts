import { SeasonalWaitException } from "./seasonal-wait-exception.js";

/** A rule a seasonal wait exception must pass. Check returns its problems, or none. */
export interface SeasonalWaitExceptionRule {
  check(item: SeasonalWaitException): string[];
}

export class SeasonalWaitExceptionRequiredCurrencyRule implements SeasonalWaitExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalWaitException): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalWaitExceptionCodePrefixRule implements SeasonalWaitExceptionRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalWaitException): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalWaitExceptionTitleLengthRule implements SeasonalWaitExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalWaitException): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal wait exception. */
export class SeasonalWaitExceptionValidator {
  rules: SeasonalWaitExceptionRule[];

  constructor(rules: SeasonalWaitExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalWaitException): string[] {
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

  requireValid(item: SeasonalWaitException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalWaitException[]): Map<string, string[]> {
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

export function defaultSeasonalWaitExceptionValidator(): SeasonalWaitExceptionValidator {
  return new SeasonalWaitExceptionValidator(
    [
      new SeasonalWaitExceptionRequiredCurrencyRule("seasonal wait exception needs this field"),
      new SeasonalWaitExceptionCodePrefixRule("REF"),
      new SeasonalWaitExceptionTitleLengthRule(1000),
    ],
  );
}
