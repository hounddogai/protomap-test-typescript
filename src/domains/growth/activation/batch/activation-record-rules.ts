import * as text from "../../../../kit/text.js";
import { ActivationRecord } from "./activation-record.js";

/** A rule a activation record must pass. Check returns its problems, or none. */
export interface ActivationRecordRule {
  check(item: ActivationRecord): string[];
}

export class ActivationRecordRequiredChannelRule implements ActivationRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationRecord): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationRecordNameLengthRule implements ActivationRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationRecord): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationRecordRequiredCodeRule implements ActivationRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationRecordCodePrefixRule implements ActivationRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ActivationRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ActivationRecordAllowedNotesRule implements ActivationRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ActivationRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.notes))) return [`notes ${item.notes} is missing`];
    return [];
  }
}

export class ActivationRecordChannelLengthRule implements ActivationRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationRecord): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a activation record. */
export class ActivationRecordValidator {
  rules: ActivationRecordRule[];

  constructor(rules: ActivationRecordRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ActivationRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationRecord[]): Map<string, string[]> {
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

export function defaultActivationRecordValidator(): ActivationRecordValidator {
  return new ActivationRecordValidator(
    [
      new ActivationRecordRequiredChannelRule("activation record needs a value"),
      new ActivationRecordNameLengthRule(120),
      new ActivationRecordRequiredCodeRule("activation record needs an entry"),
      new ActivationRecordCodePrefixRule("X"),
      new ActivationRecordAllowedNotesRule(["strict", "tiered", "global"]),
      new ActivationRecordChannelLengthRule(32),
    ],
  );
}
