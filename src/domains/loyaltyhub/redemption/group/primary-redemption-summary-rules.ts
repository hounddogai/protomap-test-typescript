import { PrimaryRedemptionSummary } from "./primary-redemption-summary.js";

/** A rule a primary redemption summary must pass. Check returns its problems, or none. */
export interface PrimaryRedemptionSummaryRule {
  check(item: PrimaryRedemptionSummary): string[];
}

export class PrimaryRedemptionSummaryRequiredChannelRule implements PrimaryRedemptionSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryRedemptionSummary): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryRedemptionSummaryChannelLengthRule implements PrimaryRedemptionSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryRedemptionSummary): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryRedemptionSummaryLocaleLengthRule implements PrimaryRedemptionSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryRedemptionSummary): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryRedemptionSummaryRequiredLabelRule implements PrimaryRedemptionSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryRedemptionSummary): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary redemption summary. */
export class PrimaryRedemptionSummaryValidator {
  rules: PrimaryRedemptionSummaryRule[];

  constructor(rules: PrimaryRedemptionSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryRedemptionSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryRedemptionSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryRedemptionSummary[]): Map<string, string[]> {
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

export function defaultPrimaryRedemptionSummaryValidator(): PrimaryRedemptionSummaryValidator {
  return new PrimaryRedemptionSummaryValidator(
    [
      new PrimaryRedemptionSummaryRequiredChannelRule("primary redemption summary needs an entry"),
      new PrimaryRedemptionSummaryChannelLengthRule(80),
      new PrimaryRedemptionSummaryLocaleLengthRule(1000),
      new PrimaryRedemptionSummaryRequiredLabelRule("primary redemption summary needs an entry"),
    ],
  );
}
