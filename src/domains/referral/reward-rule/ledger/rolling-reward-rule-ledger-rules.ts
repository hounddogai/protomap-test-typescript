import { RollingRewardRuleLedger } from "./rolling-reward-rule-ledger.js";

/** A rule a rolling reward rule ledger must pass. Check returns its problems, or none. */
export interface RollingRewardRuleLedgerRule {
  check(item: RollingRewardRuleLedger): string[];
}

export class RollingRewardRuleLedgerRequiredLabelRule implements RollingRewardRuleLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingRewardRuleLedger): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RollingRewardRuleLedgerRequiredJourneyIdRule implements RollingRewardRuleLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingRewardRuleLedger): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class RollingRewardRuleLedgerCodeLengthRule implements RollingRewardRuleLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingRewardRuleLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling reward rule ledger. */
export class RollingRewardRuleLedgerValidator {
  rules: RollingRewardRuleLedgerRule[];

  constructor(rules: RollingRewardRuleLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: RollingRewardRuleLedger): string[] {
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

  requireValid(item: RollingRewardRuleLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingRewardRuleLedger[]): Map<string, string[]> {
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

export function defaultRollingRewardRuleLedgerValidator(): RollingRewardRuleLedgerValidator {
  return new RollingRewardRuleLedgerValidator(
    [
      new RollingRewardRuleLedgerRequiredLabelRule("rolling reward rule ledger needs an entry"),
      new RollingRewardRuleLedgerRequiredJourneyIdRule("rolling reward rule ledger needs a value"),
      new RollingRewardRuleLedgerCodeLengthRule(3600),
    ],
  );
}
