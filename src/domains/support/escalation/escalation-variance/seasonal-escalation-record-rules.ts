import { SeasonalEscalationRecord } from "./seasonal-escalation-record.js";

/** A rule a seasonal escalation record must pass. Check returns its problems, or none. */
export interface SeasonalEscalationRecordRule {
  check(item: SeasonalEscalationRecord): string[];
}

export class SeasonalEscalationRecordTitleLengthRule implements SeasonalEscalationRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalEscalationRecord): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalEscalationRecordRequiredTitleRule implements SeasonalEscalationRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalEscalationRecord): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalEscalationRecordRequiredChannelRule implements SeasonalEscalationRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalEscalationRecord): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal escalation record. */
export class SeasonalEscalationRecordValidator {
  rules: SeasonalEscalationRecordRule[];

  constructor(rules: SeasonalEscalationRecordRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalEscalationRecord): string[] {
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

  requireValid(item: SeasonalEscalationRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalEscalationRecord[]): Map<string, string[]> {
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

export function defaultSeasonalEscalationRecordValidator(): SeasonalEscalationRecordValidator {
  return new SeasonalEscalationRecordValidator(
    [
      new SeasonalEscalationRecordTitleLengthRule(32),
      new SeasonalEscalationRecordRequiredTitleRule("seasonal escalation record needs a value"),
      new SeasonalEscalationRecordRequiredChannelRule("seasonal escalation record needs this field"),
    ],
  );
}
