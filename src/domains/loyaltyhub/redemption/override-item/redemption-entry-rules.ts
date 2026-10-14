import * as text from "../../../../kit/text.js";
import { RedemptionEntry } from "./redemption-entry.js";

/** A rule a redemption entry must pass. Check returns its problems, or none. */
export interface RedemptionEntryRule {
  check(item: RedemptionEntry): string[];
}

export class RedemptionEntryOwnerIdLengthRule implements RedemptionEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionEntry): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionEntryCodePrefixRule implements RedemptionEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RedemptionEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RedemptionEntryTitleLengthRule implements RedemptionEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionEntry): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionEntryRequiredTimezoneRule implements RedemptionEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionEntry): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionEntryAllowedTitleRule implements RedemptionEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RedemptionEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is missing`];
    return [];
  }
}

export class RedemptionEntryRequiredOwnerIdRule implements RedemptionEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionEntry): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a redemption entry. */
export class RedemptionEntryValidator {
  rules: RedemptionEntryRule[];

  constructor(rules: RedemptionEntryRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionEntry): string[] {
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

  requireValid(item: RedemptionEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionEntry[]): Map<string, string[]> {
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

export function defaultRedemptionEntryValidator(): RedemptionEntryValidator {
  return new RedemptionEntryValidator(
    [
      new RedemptionEntryOwnerIdLengthRule(120),
      new RedemptionEntryCodePrefixRule("REF"),
      new RedemptionEntryTitleLengthRule(80),
      new RedemptionEntryRequiredTimezoneRule("redemption entry needs an entry"),
      new RedemptionEntryAllowedTitleRule(["strict", "global"]),
      new RedemptionEntryRequiredOwnerIdRule("redemption entry needs an entry"),
    ],
  );
}
