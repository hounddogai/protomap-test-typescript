import { RegionalApprovalRecord } from "./regional-approval-record.js";

/** A rule a regional approval record must pass. Check returns its problems, or none. */
export interface RegionalApprovalRecordRule {
  check(item: RegionalApprovalRecord): string[];
}

export class RegionalApprovalRecordRequiredAudienceIdRule implements RegionalApprovalRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalApprovalRecord): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalApprovalRecordAudienceIdLengthRule implements RegionalApprovalRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalApprovalRecord): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalApprovalRecordRequiredTitleRule implements RegionalApprovalRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalApprovalRecord): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional approval record. */
export class RegionalApprovalRecordValidator {
  rules: RegionalApprovalRecordRule[];

  constructor(rules: RegionalApprovalRecordRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalApprovalRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalApprovalRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalApprovalRecord[]): Map<string, string[]> {
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

export function defaultRegionalApprovalRecordValidator(): RegionalApprovalRecordValidator {
  return new RegionalApprovalRecordValidator(
    [
      new RegionalApprovalRecordRequiredAudienceIdRule("regional approval record needs this field"),
      new RegionalApprovalRecordAudienceIdLengthRule(80),
      new RegionalApprovalRecordRequiredTitleRule("regional approval record needs an entry"),
    ],
  );
}
