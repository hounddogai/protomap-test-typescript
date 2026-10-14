import { RegionalRewardRuleLedger } from "./regional-reward-rule-ledger.js";

/** A rule a regional reward rule ledger must pass. Check returns its problems, or none. */
export interface RegionalRewardRuleLedgerRule {
  check(item: RegionalRewardRuleLedger): string[];
}

export class RegionalRewardRuleLedgerRequiredLabelRule implements RegionalRewardRuleLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalRewardRuleLedger): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalRewardRuleLedgerCodePrefixRule implements RegionalRewardRuleLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalRewardRuleLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalRewardRuleLedgerLabelLengthRule implements RegionalRewardRuleLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalRewardRuleLedger): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalRewardRuleLedgerCohortLengthRule implements RegionalRewardRuleLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalRewardRuleLedger): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalRewardRuleLedgerRatioRangeRule implements RegionalRewardRuleLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalRewardRuleLedger): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalRewardRuleLedgerCodeLengthRule implements RegionalRewardRuleLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalRewardRuleLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional reward rule ledger. */
export class RegionalRewardRuleLedgerValidator {
  rules: RegionalRewardRuleLedgerRule[];

  constructor(rules: RegionalRewardRuleLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalRewardRuleLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalRewardRuleLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalRewardRuleLedger[]): Map<string, string[]> {
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

export function defaultRegionalRewardRuleLedgerValidator(): RegionalRewardRuleLedgerValidator {
  return new RegionalRewardRuleLedgerValidator(
    [
      new RegionalRewardRuleLedgerRequiredLabelRule("regional reward rule ledger needs an entry"),
      new RegionalRewardRuleLedgerCodePrefixRule("Q"),
      new RegionalRewardRuleLedgerLabelLengthRule(86400),
      new RegionalRewardRuleLedgerCohortLengthRule(64),
      new RegionalRewardRuleLedgerRatioRangeRule(2.8, 3452.7),
      new RegionalRewardRuleLedgerCodeLengthRule(3600),
    ],
  );
}
