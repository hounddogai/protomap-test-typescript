import * as text from "../../../../kit/text.js";
import { RollingFunnelThreshold } from "./rolling-funnel-threshold.js";

/** A rule a rolling funnel threshold must pass. Check returns its problems, or none. */
export interface RollingFunnelThresholdRule {
  check(item: RollingFunnelThreshold): string[];
}

export class RollingFunnelThresholdUnitLengthRule implements RollingFunnelThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingFunnelThreshold): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingFunnelThresholdAllowedTitleRule implements RollingFunnelThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingFunnelThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is above maximum`];
    return [];
  }
}

export class RollingFunnelThresholdScoreRangeRule implements RollingFunnelThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingFunnelThreshold): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingFunnelThresholdRequiredUnitRule implements RollingFunnelThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingFunnelThreshold): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling funnel threshold. */
export class RollingFunnelThresholdValidator {
  rules: RollingFunnelThresholdRule[];

  constructor(rules: RollingFunnelThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: RollingFunnelThreshold): string[] {
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

  requireValid(item: RollingFunnelThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingFunnelThreshold[]): Map<string, string[]> {
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

export function defaultRollingFunnelThresholdValidator(): RollingFunnelThresholdValidator {
  return new RollingFunnelThresholdValidator(
    [
      new RollingFunnelThresholdUnitLengthRule(86400),
      new RollingFunnelThresholdAllowedTitleRule(["regional", "fallback"]),
      new RollingFunnelThresholdScoreRangeRule(3, 3483.4),
      new RollingFunnelThresholdRequiredUnitRule("rolling funnel threshold needs an entry"),
    ],
  );
}
