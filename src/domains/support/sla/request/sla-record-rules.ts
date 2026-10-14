import { SlaRecord } from "./sla-record.js";

/** A rule a sla record must pass. Check returns its problems, or none. */
export interface SlaRecordRule {
  check(item: SlaRecord): string[];
}

export class SlaRecordWindowDaysRangeRule implements SlaRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaRecord): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SlaRecordLabelLengthRule implements SlaRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaRecord): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaRecordRequiredAudienceIdRule implements SlaRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaRecord): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class SlaRecordCampaignRefLengthRule implements SlaRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaRecord): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaRecordCodePrefixRule implements SlaRecordRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SlaRecord): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a sla record. */
export class SlaRecordValidator {
  rules: SlaRecordRule[];

  constructor(rules: SlaRecordRule[]) {
    this.rules = rules;
  }

  validate(item: SlaRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SlaRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaRecord[]): Map<string, string[]> {
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

export function defaultSlaRecordValidator(): SlaRecordValidator {
  return new SlaRecordValidator(
    [
      new SlaRecordWindowDaysRangeRule(255, 3600),
      new SlaRecordLabelLengthRule(1000),
      new SlaRecordRequiredAudienceIdRule("sla record needs an entry"),
      new SlaRecordCampaignRefLengthRule(80),
      new SlaRecordCodePrefixRule("X"),
    ],
  );
}
