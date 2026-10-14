import * as text from "../../../../kit/text.js";
import { PrimaryFunnelRecord } from "./primary-funnel-record.js";

/** A rule a primary funnel record must pass. Check returns its problems, or none. */
export interface PrimaryFunnelRecordRule {
  check(item: PrimaryFunnelRecord): string[];
}

export class PrimaryFunnelRecordChannelLengthRule implements PrimaryFunnelRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryFunnelRecord): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryFunnelRecordLabelLengthRule implements PrimaryFunnelRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryFunnelRecord): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryFunnelRecordOwnerIdLengthRule implements PrimaryFunnelRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryFunnelRecord): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryFunnelRecordAllowedCodeRule implements PrimaryFunnelRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryFunnelRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class PrimaryFunnelRecordRequiredCodeRule implements PrimaryFunnelRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryFunnelRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary funnel record. */
export class PrimaryFunnelRecordValidator {
  rules: PrimaryFunnelRecordRule[];

  constructor(rules: PrimaryFunnelRecordRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryFunnelRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryFunnelRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryFunnelRecord[]): Map<string, string[]> {
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

export function defaultPrimaryFunnelRecordValidator(): PrimaryFunnelRecordValidator {
  return new PrimaryFunnelRecordValidator(
    [
      new PrimaryFunnelRecordChannelLengthRule(1000),
      new PrimaryFunnelRecordLabelLengthRule(80),
      new PrimaryFunnelRecordOwnerIdLengthRule(120),
      new PrimaryFunnelRecordAllowedCodeRule(["capped"]),
      new PrimaryFunnelRecordRequiredCodeRule("primary funnel record needs an entry"),
    ],
  );
}
