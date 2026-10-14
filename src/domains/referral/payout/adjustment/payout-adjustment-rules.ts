import { PayoutAdjustment } from "./payout-adjustment.js";

/** A rule a payout adjustment must pass. Check returns its problems, or none. */
export interface PayoutAdjustmentRule {
  check(item: PayoutAdjustment): string[];
}

export class PayoutAdjustmentRequiredCodeRule implements PayoutAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutAdjustmentCodePrefixRule implements PayoutAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PayoutAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PayoutAdjustmentRequiredOwnerIdRule implements PayoutAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutAdjustment): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a payout adjustment. */
export class PayoutAdjustmentValidator {
  rules: PayoutAdjustmentRule[];

  constructor(rules: PayoutAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutAdjustment): string[] {
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

  requireValid(item: PayoutAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutAdjustment[]): Map<string, string[]> {
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

export function defaultPayoutAdjustmentValidator(): PayoutAdjustmentValidator {
  return new PayoutAdjustmentValidator(
    [
      new PayoutAdjustmentRequiredCodeRule("payout adjustment needs an entry"),
      new PayoutAdjustmentCodePrefixRule("X"),
      new PayoutAdjustmentRequiredOwnerIdRule("payout adjustment needs an entry"),
    ],
  );
}
