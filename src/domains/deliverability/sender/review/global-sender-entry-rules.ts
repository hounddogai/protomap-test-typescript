import { GlobalSenderEntry } from "./global-sender-entry.js";

/** A rule a global sender entry must pass. Check returns its problems, or none. */
export interface GlobalSenderEntryRule {
  check(item: GlobalSenderEntry): string[];
}

export class GlobalSenderEntryExpiresAtRangeRule implements GlobalSenderEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalSenderEntry): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalSenderEntryCodeLengthRule implements GlobalSenderEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalSenderEntry): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalSenderEntrySendAtRangeRule implements GlobalSenderEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalSenderEntry): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalSenderEntryLabelLengthRule implements GlobalSenderEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalSenderEntry): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalSenderEntryRequiredChannelRule implements GlobalSenderEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalSenderEntry): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalSenderEntryChannelLengthRule implements GlobalSenderEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalSenderEntry): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global sender entry. */
export class GlobalSenderEntryValidator {
  rules: GlobalSenderEntryRule[];

  constructor(rules: GlobalSenderEntryRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalSenderEntry): string[] {
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

  requireValid(item: GlobalSenderEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalSenderEntry[]): Map<string, string[]> {
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

export function defaultGlobalSenderEntryValidator(): GlobalSenderEntryValidator {
  return new GlobalSenderEntryValidator(
    [
      new GlobalSenderEntryExpiresAtRangeRule(32, 64),
      new GlobalSenderEntryCodeLengthRule(255),
      new GlobalSenderEntrySendAtRangeRule(3600, 3600),
      new GlobalSenderEntryLabelLengthRule(64),
      new GlobalSenderEntryRequiredChannelRule("global sender entry needs this field"),
      new GlobalSenderEntryChannelLengthRule(3600),
    ],
  );
}
