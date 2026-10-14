import * as text from "../../../../kit/text.js";
import { BounceRecord } from "./bounce-record.js";

/** A rule a bounce record must pass. Check returns its problems, or none. */
export interface BounceRecordRule {
  check(item: BounceRecord): string[];
}

export class BounceRecordLabelLengthRule implements BounceRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceRecord): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BounceRecordRequiredSourceRule implements BounceRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceRecord): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class BounceRecordCodePrefixRule implements BounceRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BounceRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BounceRecordAllowedSourceRule implements BounceRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BounceRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is out of range`];
    return [];
  }
}

export class BounceRecordSourceLengthRule implements BounceRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceRecord): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a bounce record. */
export class BounceRecordValidator {
  rules: BounceRecordRule[];

  constructor(rules: BounceRecordRule[]) {
    this.rules = rules;
  }

  validate(item: BounceRecord): string[] {
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

  requireValid(item: BounceRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BounceRecord[]): Map<string, string[]> {
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

export function defaultBounceRecordValidator(): BounceRecordValidator {
  return new BounceRecordValidator(
    [
      new BounceRecordLabelLengthRule(255),
      new BounceRecordRequiredSourceRule("bounce record needs a value"),
      new BounceRecordCodePrefixRule("Q"),
      new BounceRecordAllowedSourceRule(["global", "adaptive", "strict"]),
      new BounceRecordSourceLengthRule(1000),
    ],
  );
}
