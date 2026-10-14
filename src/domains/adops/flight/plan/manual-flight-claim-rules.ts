import * as text from "../../../../kit/text.js";
import { ManualFlightClaim } from "./manual-flight-claim.js";

/** A rule a manual flight claim must pass. Check returns its problems, or none. */
export interface ManualFlightClaimRule {
  check(item: ManualFlightClaim): string[];
}

export class ManualFlightClaimAmountRangeRule implements ManualFlightClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualFlightClaim): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualFlightClaimDiscountRangeRule implements ManualFlightClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualFlightClaim): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualFlightClaimAllowedSegmentRule implements ManualFlightClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualFlightClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is too long`];
    return [];
  }
}

export class ManualFlightClaimRequiredNameRule implements ManualFlightClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualFlightClaim): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual flight claim. */
export class ManualFlightClaimValidator {
  rules: ManualFlightClaimRule[];

  constructor(rules: ManualFlightClaimRule[]) {
    this.rules = rules;
  }

  validate(item: ManualFlightClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualFlightClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualFlightClaim[]): Map<string, string[]> {
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

export function defaultManualFlightClaimValidator(): ManualFlightClaimValidator {
  return new ManualFlightClaimValidator(
    [
      new ManualFlightClaimAmountRangeRule(3.6, 4092.2),
      new ManualFlightClaimDiscountRangeRule(5.7, 1569.7),
      new ManualFlightClaimAllowedSegmentRule([]),
      new ManualFlightClaimRequiredNameRule("manual flight claim needs an entry"),
    ],
  );
}
