import * as text from "../../../../kit/text.js";
import { RegionalSenderProfile } from "./regional-sender-profile.js";

/** A rule a regional sender profile must pass. Check returns its problems, or none. */
export interface RegionalSenderProfileRule {
  check(item: RegionalSenderProfile): string[];
}

export class RegionalSenderProfileRequiredCodeRule implements RegionalSenderProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalSenderProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalSenderProfileCodePrefixRule implements RegionalSenderProfileRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalSenderProfile): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalSenderProfileRequiredCurrencyRule implements RegionalSenderProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalSenderProfile): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalSenderProfileJourneyIdLengthRule implements RegionalSenderProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalSenderProfile): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalSenderProfileAllowedLocaleRule implements RegionalSenderProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalSenderProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is not allowed`];
    return [];
  }
}

/** Runs every rule of a regional sender profile. */
export class RegionalSenderProfileValidator {
  rules: RegionalSenderProfileRule[];

  constructor(rules: RegionalSenderProfileRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalSenderProfile): string[] {
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

  requireValid(item: RegionalSenderProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalSenderProfile[]): Map<string, string[]> {
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

export function defaultRegionalSenderProfileValidator(): RegionalSenderProfileValidator {
  return new RegionalSenderProfileValidator(
    [
      new RegionalSenderProfileRequiredCodeRule("regional sender profile needs an entry"),
      new RegionalSenderProfileCodePrefixRule("REF"),
      new RegionalSenderProfileRequiredCurrencyRule("regional sender profile needs an entry"),
      new RegionalSenderProfileJourneyIdLengthRule(32),
      new RegionalSenderProfileAllowedLocaleRule(["fallback", "lenient"]),
    ],
  );
}
