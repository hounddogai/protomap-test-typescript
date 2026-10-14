import { CappedNudgeEntry } from "./capped-nudge-entry.js";

/** A rule a capped nudge entry must pass. Check returns its problems, or none. */
export interface CappedNudgeEntryRule {
  check(item: CappedNudgeEntry): string[];
}

export class CappedNudgeEntryCodeLengthRule implements CappedNudgeEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedNudgeEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedNudgeEntryCodePrefixRule implements CappedNudgeEntryRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedNudgeEntry): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CappedNudgeEntryRequiredChannelRule implements CappedNudgeEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedNudgeEntry): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class CappedNudgeEntryLabelLengthRule implements CappedNudgeEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedNudgeEntry): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedNudgeEntryArchivedGuardRule implements CappedNudgeEntryRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CappedNudgeEntry): string[] {
    if (item.archived && item.threshold > this.limit) return [`threshold ${item.threshold} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class CappedNudgeEntryCountryLengthRule implements CappedNudgeEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedNudgeEntry): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped nudge entry. */
export class CappedNudgeEntryValidator {
  rules: CappedNudgeEntryRule[];

  constructor(rules: CappedNudgeEntryRule[]) {
    this.rules = rules;
  }

  validate(item: CappedNudgeEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedNudgeEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedNudgeEntry[]): Map<string, string[]> {
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

export function defaultCappedNudgeEntryValidator(): CappedNudgeEntryValidator {
  return new CappedNudgeEntryValidator(
    [
      new CappedNudgeEntryCodeLengthRule(16),
      new CappedNudgeEntryCodePrefixRule("X"),
      new CappedNudgeEntryRequiredChannelRule("capped nudge entry needs this field"),
      new CappedNudgeEntryLabelLengthRule(80),
      new CappedNudgeEntryArchivedGuardRule(3.3),
      new CappedNudgeEntryCountryLengthRule(86400),
    ],
  );
}
