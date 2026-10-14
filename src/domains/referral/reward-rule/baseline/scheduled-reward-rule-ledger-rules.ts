import { ScheduledRewardRuleLedger } from "./scheduled-reward-rule-ledger.js";

/** A rule a scheduled reward rule ledger must pass. Check returns its problems, or none. */
export interface ScheduledRewardRuleLedgerRule {
  check(item: ScheduledRewardRuleLedger): string[];
}

export class ScheduledRewardRuleLedgerRequiredCodeRule implements ScheduledRewardRuleLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledRewardRuleLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledRewardRuleLedgerRequiredCohortRule implements ScheduledRewardRuleLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledRewardRuleLedger): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledRewardRuleLedgerRequiredTitleRule implements ScheduledRewardRuleLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledRewardRuleLedger): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled reward rule ledger. */
export class ScheduledRewardRuleLedgerValidator {
  rules: ScheduledRewardRuleLedgerRule[];

  constructor(rules: ScheduledRewardRuleLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledRewardRuleLedger): string[] {
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

  requireValid(item: ScheduledRewardRuleLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledRewardRuleLedger[]): Map<string, string[]> {
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

export function defaultScheduledRewardRuleLedgerValidator(): ScheduledRewardRuleLedgerValidator {
  return new ScheduledRewardRuleLedgerValidator(
    [
      new ScheduledRewardRuleLedgerRequiredCodeRule("scheduled reward rule ledger needs this field"),
      new ScheduledRewardRuleLedgerRequiredCohortRule("scheduled reward rule ledger needs this field"),
      new ScheduledRewardRuleLedgerRequiredTitleRule("scheduled reward rule ledger needs a value"),
    ],
  );
}
