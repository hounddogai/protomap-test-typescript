import * as text from "../../../../kit/text.js";
import { RollingTierSegment } from "./rolling-tier-segment.js";

/** A rule a rolling tier segment must pass. Check returns its problems, or none. */
export interface RollingTierSegmentRule {
  check(item: RollingTierSegment): string[];
}

export class RollingTierSegmentAllowedCodeRule implements RollingTierSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingTierSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class RollingTierSegmentPriorityRangeRule implements RollingTierSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingTierSegment): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingTierSegmentRequiredCodeRule implements RollingTierSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingTierSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingTierSegmentCodePrefixRule implements RollingTierSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingTierSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingTierSegmentRateRangeRule implements RollingTierSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingTierSegment): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a rolling tier segment. */
export class RollingTierSegmentValidator {
  rules: RollingTierSegmentRule[];

  constructor(rules: RollingTierSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: RollingTierSegment): string[] {
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

  requireValid(item: RollingTierSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingTierSegment[]): Map<string, string[]> {
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

export function defaultRollingTierSegmentValidator(): RollingTierSegmentValidator {
  return new RollingTierSegmentValidator(
    [
      new RollingTierSegmentAllowedCodeRule(["manual", "regional", "adaptive"]),
      new RollingTierSegmentPriorityRangeRule(32, 80),
      new RollingTierSegmentRequiredCodeRule("rolling tier segment needs this field"),
      new RollingTierSegmentCodePrefixRule("OPS"),
      new RollingTierSegmentRateRangeRule(9.7, 2880.9),
    ],
  );
}
