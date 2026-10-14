import * as text from "../../../../kit/text.js";
import { RollingFlightScore } from "./rolling-flight-score.js";

/** A rule a rolling flight score must pass. Check returns its problems, or none. */
export interface RollingFlightScoreRule {
  check(item: RollingFlightScore): string[];
}

export class RollingFlightScoreSequenceRangeRule implements RollingFlightScoreRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingFlightScore): string[] {
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

export class RollingFlightScoreLabelLengthRule implements RollingFlightScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingFlightScore): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingFlightScoreAllowedCodeRule implements RollingFlightScoreRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingFlightScore): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

export class RollingFlightScoreRegionLengthRule implements RollingFlightScoreRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingFlightScore): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling flight score. */
export class RollingFlightScoreValidator {
  rules: RollingFlightScoreRule[];

  constructor(rules: RollingFlightScoreRule[]) {
    this.rules = rules;
  }

  validate(item: RollingFlightScore): string[] {
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

  requireValid(item: RollingFlightScore): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingFlightScore[]): Map<string, string[]> {
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

export function defaultRollingFlightScoreValidator(): RollingFlightScoreValidator {
  return new RollingFlightScoreValidator(
    [
      new RollingFlightScoreSequenceRangeRule(64, 64),
      new RollingFlightScoreLabelLengthRule(3600),
      new RollingFlightScoreAllowedCodeRule(["strict", "legacy"]),
      new RollingFlightScoreRegionLengthRule(32),
    ],
  );
}
