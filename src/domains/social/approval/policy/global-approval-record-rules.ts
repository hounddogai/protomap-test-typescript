import * as text from "../../../../kit/text.js";
import { GlobalApprovalRecord } from "./global-approval-record.js";

/** A rule a global approval record must pass. Check returns its problems, or none. */
export interface GlobalApprovalRecordRule {
  check(item: GlobalApprovalRecord): string[];
}

export class GlobalApprovalRecordNameLengthRule implements GlobalApprovalRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalApprovalRecord): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalApprovalRecordAllowedCodeRule implements GlobalApprovalRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalApprovalRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

export class GlobalApprovalRecordBidRangeRule implements GlobalApprovalRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalApprovalRecord): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalApprovalRecordReviewerLengthRule implements GlobalApprovalRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalApprovalRecord): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalApprovalRecordRequiredCodeRule implements GlobalApprovalRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalApprovalRecord): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalApprovalRecordVersionRangeRule implements GlobalApprovalRecordRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalApprovalRecord): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a global approval record. */
export class GlobalApprovalRecordValidator {
  rules: GlobalApprovalRecordRule[];

  constructor(rules: GlobalApprovalRecordRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalApprovalRecord): string[] {
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

  requireValid(item: GlobalApprovalRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalApprovalRecord[]): Map<string, string[]> {
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

export function defaultGlobalApprovalRecordValidator(): GlobalApprovalRecordValidator {
  return new GlobalApprovalRecordValidator(
    [
      new GlobalApprovalRecordNameLengthRule(64),
      new GlobalApprovalRecordAllowedCodeRule(["legacy"]),
      new GlobalApprovalRecordBidRangeRule(3.9, 2486.8),
      new GlobalApprovalRecordReviewerLengthRule(80),
      new GlobalApprovalRecordRequiredCodeRule("global approval record needs a value"),
      new GlobalApprovalRecordVersionRangeRule(80, 255),
    ],
  );
}
