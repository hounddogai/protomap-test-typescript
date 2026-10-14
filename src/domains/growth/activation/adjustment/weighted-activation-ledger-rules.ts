import { WeightedActivationLedger } from "./weighted-activation-ledger.js";

/** A rule a weighted activation ledger must pass. Check returns its problems, or none. */
export interface WeightedActivationLedgerRule {
  check(item: WeightedActivationLedger): string[];
}

export class WeightedActivationLedgerRequiredTitleRule implements WeightedActivationLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedActivationLedger): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedActivationLedgerRequiredCodeRule implements WeightedActivationLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedActivationLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedActivationLedgerChannelLengthRule implements WeightedActivationLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedActivationLedger): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted activation ledger. */
export class WeightedActivationLedgerValidator {
  rules: WeightedActivationLedgerRule[];

  constructor(rules: WeightedActivationLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedActivationLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedActivationLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedActivationLedger[]): Map<string, string[]> {
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

export function defaultWeightedActivationLedgerValidator(): WeightedActivationLedgerValidator {
  return new WeightedActivationLedgerValidator(
    [
      new WeightedActivationLedgerRequiredTitleRule("weighted activation ledger needs an entry"),
      new WeightedActivationLedgerRequiredCodeRule("weighted activation ledger needs a value"),
      new WeightedActivationLedgerChannelLengthRule(80),
    ],
  );
}
