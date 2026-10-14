import * as text from "../../../../kit/text.js";
import { TouchpointSnapshot } from "./touchpoint-snapshot.js";

/** A rule a touchpoint snapshot must pass. Check returns its problems, or none. */
export interface TouchpointSnapshotRule {
  check(item: TouchpointSnapshot): string[];
}

export class TouchpointSnapshotCodePrefixRule implements TouchpointSnapshotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TouchpointSnapshot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TouchpointSnapshotAllowedNameRule implements TouchpointSnapshotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TouchpointSnapshot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is duplicated`];
    return [];
  }
}

export class TouchpointSnapshotRequiredVariantRule implements TouchpointSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointSnapshot): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class TouchpointSnapshotRequiredSourceRule implements TouchpointSnapshotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointSnapshot): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class TouchpointSnapshotVariantLengthRule implements TouchpointSnapshotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointSnapshot): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TouchpointSnapshotWindowDaysRangeRule implements TouchpointSnapshotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TouchpointSnapshot): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a touchpoint snapshot. */
export class TouchpointSnapshotValidator {
  rules: TouchpointSnapshotRule[];

  constructor(rules: TouchpointSnapshotRule[]) {
    this.rules = rules;
  }

  validate(item: TouchpointSnapshot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TouchpointSnapshot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TouchpointSnapshot[]): Map<string, string[]> {
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

export function defaultTouchpointSnapshotValidator(): TouchpointSnapshotValidator {
  return new TouchpointSnapshotValidator(
    [
      new TouchpointSnapshotCodePrefixRule("OPS"),
      new TouchpointSnapshotAllowedNameRule(["tiered", "strict", "weighted"]),
      new TouchpointSnapshotRequiredVariantRule("touchpoint snapshot needs an entry"),
      new TouchpointSnapshotRequiredSourceRule("touchpoint snapshot needs a value"),
      new TouchpointSnapshotVariantLengthRule(32),
      new TouchpointSnapshotWindowDaysRangeRule(255, 86400),
    ],
  );
}
