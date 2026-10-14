import { InviteRecord } from "./invite-record.js";

/** A rule a invite record must pass. Check returns its problems, or none. */
export interface InviteRecordRule {
  check(item: InviteRecord): string[];
}

export class InviteRecordMaximumRangeRule implements InviteRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InviteRecord): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class InviteRecordActiveGuardRule implements InviteRecordRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: InviteRecord): string[] {
    if (item.active && item.maximum > this.limit) return [`maximum ${item.maximum} exceeds ${this.limit} while active`];
    return [];
  }
}

export class InviteRecordCodeLengthRule implements InviteRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteRecord): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteRecordRequiredSummaryRule implements InviteRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteRecord): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class InviteRecordImpressionsRangeRule implements InviteRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InviteRecord): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class InviteRecordRequiredUnitRule implements InviteRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InviteRecord): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a invite record. */
export class InviteRecordValidator {
  rules: InviteRecordRule[];

  constructor(rules: InviteRecordRule[]) {
    this.rules = rules;
  }

  validate(item: InviteRecord): string[] {
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

  requireValid(item: InviteRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteRecord[]): Map<string, string[]> {
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

export function defaultInviteRecordValidator(): InviteRecordValidator {
  return new InviteRecordValidator(
    [
      new InviteRecordMaximumRangeRule(8.1, 3539.8),
      new InviteRecordActiveGuardRule(3.3),
      new InviteRecordCodeLengthRule(255),
      new InviteRecordRequiredSummaryRule("invite record needs this field"),
      new InviteRecordImpressionsRangeRule(16, 1000),
      new InviteRecordRequiredUnitRule("invite record needs a value"),
    ],
  );
}
