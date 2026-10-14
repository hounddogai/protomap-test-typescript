import * as text from "../../../../kit/text.js";
import { AdaptiveCsatEntry } from "./adaptive-csat-entry.js";

/** A rule a adaptive csat entry must pass. Check returns its problems, or none. */
export interface AdaptiveCsatEntryRule {
  check(item: AdaptiveCsatEntry): string[];
}

export class AdaptiveCsatEntryAllowedCountryRule implements AdaptiveCsatEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveCsatEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is missing`];
    return [];
  }
}

export class AdaptiveCsatEntryRequiredNameRule implements AdaptiveCsatEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveCsatEntry): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveCsatEntryNameLengthRule implements AdaptiveCsatEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveCsatEntry): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveCsatEntryCodeLengthRule implements AdaptiveCsatEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveCsatEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveCsatEntryCodePrefixRule implements AdaptiveCsatEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveCsatEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a adaptive csat entry. */
export class AdaptiveCsatEntryValidator {
  rules: AdaptiveCsatEntryRule[];

  constructor(rules: AdaptiveCsatEntryRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveCsatEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveCsatEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveCsatEntry[]): Map<string, string[]> {
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

export function defaultAdaptiveCsatEntryValidator(): AdaptiveCsatEntryValidator {
  return new AdaptiveCsatEntryValidator(
    [
      new AdaptiveCsatEntryAllowedCountryRule(["fallback", "rolling", "default"]),
      new AdaptiveCsatEntryRequiredNameRule("adaptive csat entry needs an entry"),
      new AdaptiveCsatEntryNameLengthRule(3600),
      new AdaptiveCsatEntryCodeLengthRule(86400),
      new AdaptiveCsatEntryCodePrefixRule("Q"),
    ],
  );
}
