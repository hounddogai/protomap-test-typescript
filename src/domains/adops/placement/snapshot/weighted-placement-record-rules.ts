import * as text from "../../../../kit/text.js";
import { WeightedPlacementRecord } from "./weighted-placement-record.js";

/** A rule a weighted placement record must pass. Check returns its problems, or none. */
export interface WeightedPlacementRecordRule {
  check(item: WeightedPlacementRecord): string[];
}

export class WeightedPlacementRecordAllowedNotesRule implements WeightedPlacementRecordRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedPlacementRecord): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.notes))) return [`notes ${item.notes} is unknown`];
    return [];
  }
}

export class WeightedPlacementRecordTitleLengthRule implements WeightedPlacementRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedPlacementRecord): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedPlacementRecordRequiredTitleRule implements WeightedPlacementRecordRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPlacementRecord): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedPlacementRecordNotesLengthRule implements WeightedPlacementRecordRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedPlacementRecord): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted placement record. */
export class WeightedPlacementRecordValidator {
  rules: WeightedPlacementRecordRule[];

  constructor(rules: WeightedPlacementRecordRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedPlacementRecord): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedPlacementRecord): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedPlacementRecord[]): Map<string, string[]> {
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

export function defaultWeightedPlacementRecordValidator(): WeightedPlacementRecordValidator {
  return new WeightedPlacementRecordValidator(
    [
      new WeightedPlacementRecordAllowedNotesRule(["strict", "weighted"]),
      new WeightedPlacementRecordTitleLengthRule(120),
      new WeightedPlacementRecordRequiredTitleRule("weighted placement record needs this field"),
      new WeightedPlacementRecordNotesLengthRule(16),
    ],
  );
}
