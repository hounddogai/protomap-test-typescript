import * as text from "../../../../kit/text.js";
import { PacingPolicy } from "./pacing-policy.js";

/** A rule a pacing policy must pass. Check returns its problems, or none. */
export interface PacingPolicyRule {
  check(item: PacingPolicy): string[];
}

export class PacingPolicyAllowedLabelRule implements PacingPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PacingPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is unknown`];
    return [];
  }
}

export class PacingPolicyCodeLengthRule implements PacingPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingPolicyTitleLengthRule implements PacingPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingPolicy): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PacingPolicyFloorValueRangeRule implements PacingPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingPolicy): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PacingPolicyChannelLengthRule implements PacingPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PacingPolicy): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pacing policy. */
export class PacingPolicyValidator {
  rules: PacingPolicyRule[];

  constructor(rules: PacingPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: PacingPolicy): string[] {
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

  requireValid(item: PacingPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingPolicy[]): Map<string, string[]> {
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

export function defaultPacingPolicyValidator(): PacingPolicyValidator {
  return new PacingPolicyValidator(
    [
      new PacingPolicyAllowedLabelRule(["adaptive"]),
      new PacingPolicyCodeLengthRule(64),
      new PacingPolicyTitleLengthRule(3600),
      new PacingPolicyFloorValueRangeRule(7.5, 2921.1),
      new PacingPolicyChannelLengthRule(16),
    ],
  );
}
