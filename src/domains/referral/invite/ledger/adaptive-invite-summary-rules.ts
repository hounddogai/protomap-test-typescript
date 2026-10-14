import { AdaptiveInviteSummary } from "./adaptive-invite-summary.js";

/** A rule a adaptive invite summary must pass. Check returns its problems, or none. */
export interface AdaptiveInviteSummaryRule {
  check(item: AdaptiveInviteSummary): string[];
}

export class AdaptiveInviteSummaryRequiredTitleRule implements AdaptiveInviteSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveInviteSummary): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveInviteSummaryLocaleLengthRule implements AdaptiveInviteSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveInviteSummary): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveInviteSummaryRequiredLocaleRule implements AdaptiveInviteSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveInviteSummary): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveInviteSummaryFrequencyCapRangeRule implements AdaptiveInviteSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveInviteSummary): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveInviteSummaryRequiredCodeRule implements AdaptiveInviteSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveInviteSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive invite summary. */
export class AdaptiveInviteSummaryValidator {
  rules: AdaptiveInviteSummaryRule[];

  constructor(rules: AdaptiveInviteSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveInviteSummary): string[] {
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

  requireValid(item: AdaptiveInviteSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveInviteSummary[]): Map<string, string[]> {
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

export function defaultAdaptiveInviteSummaryValidator(): AdaptiveInviteSummaryValidator {
  return new AdaptiveInviteSummaryValidator(
    [
      new AdaptiveInviteSummaryRequiredTitleRule("adaptive invite summary needs a value"),
      new AdaptiveInviteSummaryLocaleLengthRule(16),
      new AdaptiveInviteSummaryRequiredLocaleRule("adaptive invite summary needs an entry"),
      new AdaptiveInviteSummaryFrequencyCapRangeRule(120, 86400),
      new AdaptiveInviteSummaryRequiredCodeRule("adaptive invite summary needs an entry"),
    ],
  );
}
