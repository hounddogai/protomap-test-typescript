import * as text from "../../../../kit/text.js";
import { FunnelSegment } from "./funnel-segment.js";

/** A rule a funnel segment must pass. Check returns its problems, or none. */
export interface FunnelSegmentRule {
  check(item: FunnelSegment): string[];
}

export class FunnelSegmentAllowedLabelRule implements FunnelSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FunnelSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is below minimum`];
    return [];
  }
}

export class FunnelSegmentLabelLengthRule implements FunnelSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelSegment): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelSegmentRequiredLabelRule implements FunnelSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelSegment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a funnel segment. */
export class FunnelSegmentValidator {
  rules: FunnelSegmentRule[];

  constructor(rules: FunnelSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelSegment): string[] {
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

  requireValid(item: FunnelSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelSegment[]): Map<string, string[]> {
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

export function defaultFunnelSegmentValidator(): FunnelSegmentValidator {
  return new FunnelSegmentValidator(
    [
      new FunnelSegmentAllowedLabelRule([]),
      new FunnelSegmentLabelLengthRule(80),
      new FunnelSegmentRequiredLabelRule("funnel segment needs a value"),
    ],
  );
}
