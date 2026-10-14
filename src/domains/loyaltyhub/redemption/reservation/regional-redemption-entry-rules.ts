import * as text from "../../../../kit/text.js";
import { RegionalRedemptionEntry } from "./regional-redemption-entry.js";

/** A rule a regional redemption entry must pass. Check returns its problems, or none. */
export interface RegionalRedemptionEntryRule {
  check(item: RegionalRedemptionEntry): string[];
}

export class RegionalRedemptionEntryNameLengthRule implements RegionalRedemptionEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalRedemptionEntry): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalRedemptionEntryBidRangeRule implements RegionalRedemptionEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalRedemptionEntry): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalRedemptionEntryAllowedCodeRule implements RegionalRedemptionEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalRedemptionEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class RegionalRedemptionEntryChannelLengthRule implements RegionalRedemptionEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalRedemptionEntry): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalRedemptionEntryCodePrefixRule implements RegionalRedemptionEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalRedemptionEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a regional redemption entry. */
export class RegionalRedemptionEntryValidator {
  rules: RegionalRedemptionEntryRule[];

  constructor(rules: RegionalRedemptionEntryRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalRedemptionEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalRedemptionEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalRedemptionEntry[]): Map<string, string[]> {
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

export function defaultRegionalRedemptionEntryValidator(): RegionalRedemptionEntryValidator {
  return new RegionalRedemptionEntryValidator(
    [
      new RegionalRedemptionEntryNameLengthRule(64),
      new RegionalRedemptionEntryBidRangeRule(9.3, 137.6),
      new RegionalRedemptionEntryAllowedCodeRule(["capped"]),
      new RegionalRedemptionEntryChannelLengthRule(86400),
      new RegionalRedemptionEntryCodePrefixRule("ACM"),
    ],
  );
}
