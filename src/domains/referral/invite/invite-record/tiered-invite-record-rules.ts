import { TieredInviteRecord } from "./tiered-invite-record.js";

/** A rule a tiered invite record must pass. Check returns its problems, or none. */
export interface TieredInviteRecordRule {
  check(item: TieredInviteRecord): string[];
}

export class TieredInviteRecordCampaignRefLengthRule implements TieredInviteRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredInviteRecord): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredInviteRecordLabelLengthRule implements TieredInviteRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredInviteRecord): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredInviteRecordRequiredCampaignRefRule implements TieredInviteRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredInviteRecord): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered invite record. */
export class TieredInviteRecordValidator {
  rules: TieredInviteRecordRule[];

  constructor(rules: TieredInviteRecordRule[]) {
    this.rules = rules;
  }

  validate(item: TieredInviteRecord): string[] {
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

  requireValid(item: TieredInviteRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredInviteRecord[]): Map<string, string[]> {
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

export function defaultTieredInviteRecordValidator(): TieredInviteRecordValidator {
  return new TieredInviteRecordValidator(
    [
      new TieredInviteRecordCampaignRefLengthRule(32),
      new TieredInviteRecordLabelLengthRule(86400),
      new TieredInviteRecordRequiredCampaignRefRule("tiered invite record needs an entry"),
    ],
  );
}
