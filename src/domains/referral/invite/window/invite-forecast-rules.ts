import { InviteForecast } from "./invite-forecast.js";

/** A rule a invite forecast must pass. Check returns its problems, or none. */
export interface InviteForecastRule {
  check(item: InviteForecast): string[];
}

export class InviteForecastRequiredCodeRule implements InviteForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteForecast): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class InviteForecastRequiredReviewerRule implements InviteForecastRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteForecast): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class InviteForecastReviewerLengthRule implements InviteForecastRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteForecast): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a invite forecast. */
export class InviteForecastValidator {
  rules: InviteForecastRule[];

  constructor(rules: InviteForecastRule[]) {
    this.rules = rules;
  }

  validate(item: InviteForecast): string[] {
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

  requireValid(item: InviteForecast): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteForecast[]): Map<string, string[]> {
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

export function defaultInviteForecastValidator(): InviteForecastValidator {
  return new InviteForecastValidator(
    [
      new InviteForecastRequiredCodeRule("invite forecast needs an entry"),
      new InviteForecastRequiredReviewerRule("invite forecast needs an entry"),
      new InviteForecastReviewerLengthRule(16),
    ],
  );
}
