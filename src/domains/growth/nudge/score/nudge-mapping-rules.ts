import * as text from "../../../../kit/text.js";
import { NudgeMapping } from "./nudge-mapping.js";

/** A rule a nudge mapping must pass. Check returns its problems, or none. */
export interface NudgeMappingRule {
  check(item: NudgeMapping): string[];
}

export class NudgeMappingOwnerIdLengthRule implements NudgeMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeMapping): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeMappingCodePrefixRule implements NudgeMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: NudgeMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class NudgeMappingAllowedUnitRule implements NudgeMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: NudgeMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.unit))) return [`unit ${item.unit} is duplicated`];
    return [];
  }
}

export class NudgeMappingRatioRangeRule implements NudgeMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeMapping): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class NudgeMappingFloorValueRangeRule implements NudgeMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeMapping): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class NudgeMappingRequiredCodeRule implements NudgeMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a nudge mapping. */
export class NudgeMappingValidator {
  rules: NudgeMappingRule[];

  constructor(rules: NudgeMappingRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeMapping): string[] {
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

  requireValid(item: NudgeMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeMapping[]): Map<string, string[]> {
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

export function defaultNudgeMappingValidator(): NudgeMappingValidator {
  return new NudgeMappingValidator(
    [
      new NudgeMappingOwnerIdLengthRule(1000),
      new NudgeMappingCodePrefixRule("REF"),
      new NudgeMappingAllowedUnitRule(["adaptive", "lenient", "capped"]),
      new NudgeMappingRatioRangeRule(0.4, 4510.2),
      new NudgeMappingFloorValueRangeRule(5.9, 3909.7),
      new NudgeMappingRequiredCodeRule("nudge mapping needs this field"),
    ],
  );
}
