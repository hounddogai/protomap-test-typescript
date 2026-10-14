import * as text from "../../../../kit/text.js";
import { RollingComplaintLedger } from "./rolling-complaint-ledger.js";

/** A rule a rolling complaint ledger must pass. Check returns its problems, or none. */
export interface RollingComplaintLedgerRule {
  check(item: RollingComplaintLedger): string[];
}

export class RollingComplaintLedgerClicksRangeRule implements RollingComplaintLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingComplaintLedger): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingComplaintLedgerSequenceRangeRule implements RollingComplaintLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingComplaintLedger): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingComplaintLedgerCostRangeRule implements RollingComplaintLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingComplaintLedger): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingComplaintLedgerAllowedCodeRule implements RollingComplaintLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingComplaintLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

export class RollingComplaintLedgerCodeLengthRule implements RollingComplaintLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingComplaintLedger): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling complaint ledger. */
export class RollingComplaintLedgerValidator {
  rules: RollingComplaintLedgerRule[];

  constructor(rules: RollingComplaintLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: RollingComplaintLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingComplaintLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingComplaintLedger[]): Map<string, string[]> {
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

export function defaultRollingComplaintLedgerValidator(): RollingComplaintLedgerValidator {
  return new RollingComplaintLedgerValidator(
    [
      new RollingComplaintLedgerClicksRangeRule(86400, 86400),
      new RollingComplaintLedgerSequenceRangeRule(64, 255),
      new RollingComplaintLedgerCostRangeRule(1.6, 1404.7),
      new RollingComplaintLedgerAllowedCodeRule(["batched", "weighted"]),
      new RollingComplaintLedgerCodeLengthRule(16),
    ],
  );
}
