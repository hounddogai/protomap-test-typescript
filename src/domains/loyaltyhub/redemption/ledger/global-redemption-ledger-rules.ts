import { GlobalRedemptionLedger } from "./global-redemption-ledger.js";

/** A rule a global redemption ledger must pass. Check returns its problems, or none. */
export interface GlobalRedemptionLedgerRule {
  check(item: GlobalRedemptionLedger): string[];
}

export class GlobalRedemptionLedgerPhoneLengthRule implements GlobalRedemptionLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalRedemptionLedger): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalRedemptionLedgerCodeLengthRule implements GlobalRedemptionLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalRedemptionLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalRedemptionLedgerCodePrefixRule implements GlobalRedemptionLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalRedemptionLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalRedemptionLedgerChannelLengthRule implements GlobalRedemptionLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalRedemptionLedger): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalRedemptionLedgerRatioRangeRule implements GlobalRedemptionLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalRedemptionLedger): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a global redemption ledger. */
export class GlobalRedemptionLedgerValidator {
  rules: GlobalRedemptionLedgerRule[];

  constructor(rules: GlobalRedemptionLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalRedemptionLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalRedemptionLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalRedemptionLedger[]): Map<string, string[]> {
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

export function defaultGlobalRedemptionLedgerValidator(): GlobalRedemptionLedgerValidator {
  return new GlobalRedemptionLedgerValidator(
    [
      new GlobalRedemptionLedgerPhoneLengthRule(80),
      new GlobalRedemptionLedgerCodeLengthRule(120),
      new GlobalRedemptionLedgerCodePrefixRule("OPS"),
      new GlobalRedemptionLedgerChannelLengthRule(32),
      new GlobalRedemptionLedgerRatioRangeRule(7.5, 2462.6),
    ],
  );
}
