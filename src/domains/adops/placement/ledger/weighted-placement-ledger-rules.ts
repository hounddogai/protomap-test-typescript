import * as text from "../../../../kit/text.js";
import { WeightedPlacementLedger } from "./weighted-placement-ledger.js";

/** A rule a weighted placement ledger must pass. Check returns its problems, or none. */
export interface WeightedPlacementLedgerRule {
  check(item: WeightedPlacementLedger): string[];
}

export class WeightedPlacementLedgerCostRangeRule implements WeightedPlacementLedgerRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedPlacementLedger): string[] {
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

export class WeightedPlacementLedgerRequiredCodeRule implements WeightedPlacementLedgerRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPlacementLedger): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedPlacementLedgerAllowedChannelRule implements WeightedPlacementLedgerRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedPlacementLedger): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is above maximum`];
    return [];
  }
}

export class WeightedPlacementLedgerNotesLengthRule implements WeightedPlacementLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedPlacementLedger): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedPlacementLedgerCountryLengthRule implements WeightedPlacementLedgerRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedPlacementLedger): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted placement ledger. */
export class WeightedPlacementLedgerValidator {
  rules: WeightedPlacementLedgerRule[];

  constructor(rules: WeightedPlacementLedgerRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedPlacementLedger): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedPlacementLedger): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedPlacementLedger[]): Map<string, string[]> {
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

export function defaultWeightedPlacementLedgerValidator(): WeightedPlacementLedgerValidator {
  return new WeightedPlacementLedgerValidator(
    [
      new WeightedPlacementLedgerCostRangeRule(6.5, 336.7),
      new WeightedPlacementLedgerRequiredCodeRule("weighted placement ledger needs this field"),
      new WeightedPlacementLedgerAllowedChannelRule(["seasonal", "adaptive"]),
      new WeightedPlacementLedgerNotesLengthRule(32),
      new WeightedPlacementLedgerCountryLengthRule(16),
    ],
  );
}
