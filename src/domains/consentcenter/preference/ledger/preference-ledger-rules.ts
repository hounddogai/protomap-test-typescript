import { PreferenceLedger } from "./preference-ledger.js";

/** A rule a preference ledger must pass. Check returns its problems, or none. */
export interface PreferenceLedgerRule {
  check(item: PreferenceLedger): string[];
}

export class PreferenceLedgerCodePrefixRule implements PreferenceLedgerRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PreferenceLedger): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PreferenceLedgerChannelLengthRule implements PreferenceLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PreferenceLedger): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PreferenceLedgerRequiredChannelRule implements PreferenceLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceLedger): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceLedgerWeightRangeRule implements PreferenceLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceLedger): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PreferenceLedgerRequiredCodeRule implements PreferenceLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceLedgerRequiredTitleRule implements PreferenceLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceLedger): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a preference ledger. */
export class PreferenceLedgerValidator {
  rules: PreferenceLedgerRule[];

  constructor(rules: PreferenceLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PreferenceLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceLedger[]): Map<string, string[]> {
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

export function defaultPreferenceLedgerValidator(): PreferenceLedgerValidator {
  return new PreferenceLedgerValidator(
    [
      new PreferenceLedgerCodePrefixRule("ACM"),
      new PreferenceLedgerChannelLengthRule(86400),
      new PreferenceLedgerRequiredChannelRule("preference ledger needs an entry"),
      new PreferenceLedgerWeightRangeRule(0.2, 4937.6),
      new PreferenceLedgerRequiredCodeRule("preference ledger needs this field"),
      new PreferenceLedgerRequiredTitleRule("preference ledger needs a value"),
    ],
  );
}
