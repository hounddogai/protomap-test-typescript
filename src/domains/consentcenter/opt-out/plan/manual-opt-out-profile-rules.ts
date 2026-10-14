import { ManualOptOutProfile } from "./manual-opt-out-profile.js";

/** A rule a manual opt out profile must pass. Check returns its problems, or none. */
export interface ManualOptOutProfileRule {
  check(item: ManualOptOutProfile): string[];
}

export class ManualOptOutProfileCodePrefixRule implements ManualOptOutProfileRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualOptOutProfile): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualOptOutProfileContactEmailLengthRule implements ManualOptOutProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualOptOutProfile): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualOptOutProfileCurrencyLengthRule implements ManualOptOutProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualOptOutProfile): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualOptOutProfileNameLengthRule implements ManualOptOutProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualOptOutProfile): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual opt out profile. */
export class ManualOptOutProfileValidator {
  rules: ManualOptOutProfileRule[];

  constructor(rules: ManualOptOutProfileRule[]) {
    this.rules = rules;
  }

  validate(item: ManualOptOutProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualOptOutProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualOptOutProfile[]): Map<string, string[]> {
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

export function defaultManualOptOutProfileValidator(): ManualOptOutProfileValidator {
  return new ManualOptOutProfileValidator(
    [
      new ManualOptOutProfileCodePrefixRule("ACM"),
      new ManualOptOutProfileContactEmailLengthRule(255),
      new ManualOptOutProfileCurrencyLengthRule(16),
      new ManualOptOutProfileNameLengthRule(32),
    ],
  );
}
