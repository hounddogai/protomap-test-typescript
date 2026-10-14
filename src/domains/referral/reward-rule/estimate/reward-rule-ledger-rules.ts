import { RewardRuleLedger } from "./reward-rule-ledger.js";

/** A rule a reward rule ledger must pass. Check returns its problems, or none. */
export interface RewardRuleLedgerRule {
  check(item: RewardRuleLedger): string[];
}

export class RewardRuleLedgerCodePrefixRule implements RewardRuleLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RewardRuleLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RewardRuleLedgerRegionLengthRule implements RewardRuleLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleLedger): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleLedgerRequiredCodeRule implements RewardRuleLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleLedgerCodeLengthRule implements RewardRuleLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reward rule ledger. */
export class RewardRuleLedgerValidator {
  rules: RewardRuleLedgerRule[];

  constructor(rules: RewardRuleLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardRuleLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleLedger[]): Map<string, string[]> {
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

export function defaultRewardRuleLedgerValidator(): RewardRuleLedgerValidator {
  return new RewardRuleLedgerValidator(
    [
      new RewardRuleLedgerCodePrefixRule("ACM"),
      new RewardRuleLedgerRegionLengthRule(80),
      new RewardRuleLedgerRequiredCodeRule("reward rule ledger needs this field"),
      new RewardRuleLedgerCodeLengthRule(1000),
    ],
  );
}
