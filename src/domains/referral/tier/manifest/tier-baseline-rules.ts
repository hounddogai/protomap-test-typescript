import * as text from "../../../../kit/text.js";
import { TierBaseline } from "./tier-baseline.js";

/** A rule a tier baseline must pass. Check returns its problems, or none. */
export interface TierBaselineRule {
  check(item: TierBaseline): string[];
}

export class TierBaselineLocaleLengthRule implements TierBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierBaseline): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TierBaselineRequiredLabelRule implements TierBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TierBaseline): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TierBaselineChecksumLengthRule implements TierBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierBaseline): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TierBaselineCodeLengthRule implements TierBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TierBaseline): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TierBaselineAllowedNotesRule implements TierBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TierBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.notes))) return [`notes ${item.notes} is too long`];
    return [];
  }
}

/** Runs every rule of a tier baseline. */
export class TierBaselineValidator {
  rules: TierBaselineRule[];

  constructor(rules: TierBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: TierBaseline): string[] {
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

  requireValid(item: TierBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TierBaseline[]): Map<string, string[]> {
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

export function defaultTierBaselineValidator(): TierBaselineValidator {
  return new TierBaselineValidator(
    [
      new TierBaselineLocaleLengthRule(16),
      new TierBaselineRequiredLabelRule("tier baseline needs this field"),
      new TierBaselineChecksumLengthRule(86400),
      new TierBaselineCodeLengthRule(16),
      new TierBaselineAllowedNotesRule(["adaptive"]),
    ],
  );
}
