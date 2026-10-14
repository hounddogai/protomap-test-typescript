import * as text from "../../../../kit/text.js";
import { FrequencyLedger } from "./frequency-ledger.js";

/** A rule a frequency ledger must pass. Check returns its problems, or none. */
export interface FrequencyLedgerRule {
  check(item: FrequencyLedger): string[];
}

export class FrequencyLedgerCodePrefixRule implements FrequencyLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FrequencyLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FrequencyLedgerAllowedTitleRule implements FrequencyLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FrequencyLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is expired`];
    return [];
  }
}

export class FrequencyLedgerTitleLengthRule implements FrequencyLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyLedger): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyLedgerRequiredJourneyIdRule implements FrequencyLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyLedger): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a frequency ledger. */
export class FrequencyLedgerValidator {
  rules: FrequencyLedgerRule[];

  constructor(rules: FrequencyLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FrequencyLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyLedger[]): Map<string, string[]> {
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

export function defaultFrequencyLedgerValidator(): FrequencyLedgerValidator {
  return new FrequencyLedgerValidator(
    [
      new FrequencyLedgerCodePrefixRule("X"),
      new FrequencyLedgerAllowedTitleRule(["strict"]),
      new FrequencyLedgerTitleLengthRule(16),
      new FrequencyLedgerRequiredJourneyIdRule("frequency ledger needs an entry"),
    ],
  );
}
