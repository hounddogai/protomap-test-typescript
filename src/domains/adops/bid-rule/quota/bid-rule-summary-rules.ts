import { BidRuleSummary } from "./bid-rule-summary.js";

/** A rule a bid rule summary must pass. Check returns its problems, or none. */
export interface BidRuleSummaryRule {
  check(item: BidRuleSummary): string[];
}

export class BidRuleSummaryJourneyIdLengthRule implements BidRuleSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BidRuleSummary): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BidRuleSummaryRequiredLabelRule implements BidRuleSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleSummary): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class BidRuleSummaryCodePrefixRule implements BidRuleSummaryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BidRuleSummary): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BidRuleSummaryRequiredJourneyIdRule implements BidRuleSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BidRuleSummary): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a bid rule summary. */
export class BidRuleSummaryValidator {
  rules: BidRuleSummaryRule[];

  constructor(rules: BidRuleSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: BidRuleSummary): string[] {
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

  requireValid(item: BidRuleSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BidRuleSummary[]): Map<string, string[]> {
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

export function defaultBidRuleSummaryValidator(): BidRuleSummaryValidator {
  return new BidRuleSummaryValidator(
    [
      new BidRuleSummaryJourneyIdLengthRule(1000),
      new BidRuleSummaryRequiredLabelRule("bid rule summary needs this field"),
      new BidRuleSummaryCodePrefixRule("X"),
      new BidRuleSummaryRequiredJourneyIdRule("bid rule summary needs a value"),
    ],
  );
}
