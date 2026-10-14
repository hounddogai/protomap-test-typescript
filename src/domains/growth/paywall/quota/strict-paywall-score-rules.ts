import { StrictPaywallScore } from "./strict-paywall-score.js";

/** A rule a strict paywall score must pass. Check returns its problems, or none. */
export interface StrictPaywallScoreRule {
  check(item: StrictPaywallScore): string[];
}

export class StrictPaywallScoreNameLengthRule implements StrictPaywallScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictPaywallScore): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictPaywallScoreCodeLengthRule implements StrictPaywallScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictPaywallScore): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictPaywallScoreRequiredJourneyIdRule implements StrictPaywallScoreRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictPaywallScore): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict paywall score. */
export class StrictPaywallScoreValidator {
  rules: StrictPaywallScoreRule[];

  constructor(rules: StrictPaywallScoreRule[]) {
    this.rules = rules;
  }

  validate(item: StrictPaywallScore): string[] {
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

  requireValid(item: StrictPaywallScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictPaywallScore[]): Map<string, string[]> {
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

export function defaultStrictPaywallScoreValidator(): StrictPaywallScoreValidator {
  return new StrictPaywallScoreValidator(
    [
      new StrictPaywallScoreNameLengthRule(1000),
      new StrictPaywallScoreCodeLengthRule(64),
      new StrictPaywallScoreRequiredJourneyIdRule("strict paywall score needs a value"),
    ],
  );
}
