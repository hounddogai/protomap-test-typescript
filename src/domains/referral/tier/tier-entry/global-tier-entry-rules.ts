import { GlobalTierEntry } from "./global-tier-entry.js";

/** A rule a global tier entry must pass. Check returns its problems, or none. */
export interface GlobalTierEntryRule {
  check(item: GlobalTierEntry): string[];
}

export class GlobalTierEntryCodePrefixRule implements GlobalTierEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalTierEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalTierEntryRequiredSourceRule implements GlobalTierEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalTierEntry): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalTierEntryCountryLengthRule implements GlobalTierEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalTierEntry): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalTierEntrySourceLengthRule implements GlobalTierEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalTierEntry): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalTierEntryCodeLengthRule implements GlobalTierEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalTierEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global tier entry. */
export class GlobalTierEntryValidator {
  rules: GlobalTierEntryRule[];

  constructor(rules: GlobalTierEntryRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalTierEntry): string[] {
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

  requireValid(item: GlobalTierEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalTierEntry[]): Map<string, string[]> {
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

export function defaultGlobalTierEntryValidator(): GlobalTierEntryValidator {
  return new GlobalTierEntryValidator(
    [
      new GlobalTierEntryCodePrefixRule("ACM"),
      new GlobalTierEntryRequiredSourceRule("global tier entry needs an entry"),
      new GlobalTierEntryCountryLengthRule(16),
      new GlobalTierEntrySourceLengthRule(16),
      new GlobalTierEntryCodeLengthRule(16),
    ],
  );
}
