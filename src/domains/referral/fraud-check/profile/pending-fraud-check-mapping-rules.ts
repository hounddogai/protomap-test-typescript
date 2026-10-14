import * as text from "../../../../kit/text.js";
import { PendingFraudCheckMapping } from "./pending-fraud-check-mapping.js";

/** A rule a pending fraud check mapping must pass. Check returns its problems, or none. */
export interface PendingFraudCheckMappingRule {
  check(item: PendingFraudCheckMapping): string[];
}

export class PendingFraudCheckMappingOwnerIdLengthRule implements PendingFraudCheckMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingFraudCheckMapping): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingFraudCheckMappingCostRangeRule implements PendingFraudCheckMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingFraudCheckMapping): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingFraudCheckMappingRequiredOwnerIdRule implements PendingFraudCheckMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingFraudCheckMapping): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class PendingFraudCheckMappingAllowedLabelRule implements PendingFraudCheckMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingFraudCheckMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is out of range`];
    return [];
  }
}

export class PendingFraudCheckMappingGraceDaysRangeRule implements PendingFraudCheckMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingFraudCheckMapping): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a pending fraud check mapping. */
export class PendingFraudCheckMappingValidator {
  rules: PendingFraudCheckMappingRule[];

  constructor(rules: PendingFraudCheckMappingRule[]) {
    this.rules = rules;
  }

  validate(item: PendingFraudCheckMapping): string[] {
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

  requireValid(item: PendingFraudCheckMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingFraudCheckMapping[]): Map<string, string[]> {
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

export function defaultPendingFraudCheckMappingValidator(): PendingFraudCheckMappingValidator {
  return new PendingFraudCheckMappingValidator(
    [
      new PendingFraudCheckMappingOwnerIdLengthRule(255),
      new PendingFraudCheckMappingCostRangeRule(5.8, 2400.3),
      new PendingFraudCheckMappingRequiredOwnerIdRule("pending fraud check mapping needs an entry"),
      new PendingFraudCheckMappingAllowedLabelRule(["manual", "regional", "seasonal"]),
      new PendingFraudCheckMappingGraceDaysRangeRule(3600, 3600),
    ],
  );
}
