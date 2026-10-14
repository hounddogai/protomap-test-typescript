import { TieredEscalationRecord } from "./tiered-escalation-record.js";

/** A rule a tiered escalation record must pass. Check returns its problems, or none. */
export interface TieredEscalationRecordRule {
  check(item: TieredEscalationRecord): string[];
}

export class TieredEscalationRecordChannelLengthRule implements TieredEscalationRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredEscalationRecord): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredEscalationRecordRequiredNameRule implements TieredEscalationRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredEscalationRecord): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class TieredEscalationRecordRequiredCodeRule implements TieredEscalationRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredEscalationRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredEscalationRecordMarginRangeRule implements TieredEscalationRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredEscalationRecord): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredEscalationRecordCodePrefixRule implements TieredEscalationRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredEscalationRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a tiered escalation record. */
export class TieredEscalationRecordValidator {
  rules: TieredEscalationRecordRule[];

  constructor(rules: TieredEscalationRecordRule[]) {
    this.rules = rules;
  }

  validate(item: TieredEscalationRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredEscalationRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredEscalationRecord[]): Map<string, string[]> {
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

export function defaultTieredEscalationRecordValidator(): TieredEscalationRecordValidator {
  return new TieredEscalationRecordValidator(
    [
      new TieredEscalationRecordChannelLengthRule(1000),
      new TieredEscalationRecordRequiredNameRule("tiered escalation record needs an entry"),
      new TieredEscalationRecordRequiredCodeRule("tiered escalation record needs this field"),
      new TieredEscalationRecordMarginRangeRule(7.8, 3713),
      new TieredEscalationRecordCodePrefixRule("X"),
    ],
  );
}
