import * as text from "../../../../kit/text.js";
import { TieredRewardCycle } from "./tiered-reward-cycle.js";

/** A rule a tiered reward cycle must pass. Check returns its problems, or none. */
export interface TieredRewardCycleRule {
  check(item: TieredRewardCycle): string[];
}

export class TieredRewardCycleRequiredLabelRule implements TieredRewardCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredRewardCycle): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TieredRewardCycleRequiredChecksumRule implements TieredRewardCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredRewardCycle): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class TieredRewardCycleSourceLengthRule implements TieredRewardCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredRewardCycle): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredRewardCycleRequiredCodeRule implements TieredRewardCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredRewardCycle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredRewardCycleLabelLengthRule implements TieredRewardCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredRewardCycle): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredRewardCycleAllowedSourceRule implements TieredRewardCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredRewardCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is out of range`];
    return [];
  }
}

/** Runs every rule of a tiered reward cycle. */
export class TieredRewardCycleValidator {
  rules: TieredRewardCycleRule[];

  constructor(rules: TieredRewardCycleRule[]) {
    this.rules = rules;
  }

  validate(item: TieredRewardCycle): string[] {
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

  requireValid(item: TieredRewardCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredRewardCycle[]): Map<string, string[]> {
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

export function defaultTieredRewardCycleValidator(): TieredRewardCycleValidator {
  return new TieredRewardCycleValidator(
    [
      new TieredRewardCycleRequiredLabelRule("tiered reward cycle needs an entry"),
      new TieredRewardCycleRequiredChecksumRule("tiered reward cycle needs a value"),
      new TieredRewardCycleSourceLengthRule(3600),
      new TieredRewardCycleRequiredCodeRule("tiered reward cycle needs this field"),
      new TieredRewardCycleLabelLengthRule(255),
      new TieredRewardCycleAllowedSourceRule(["primary", "fallback", "adaptive"]),
    ],
  );
}
