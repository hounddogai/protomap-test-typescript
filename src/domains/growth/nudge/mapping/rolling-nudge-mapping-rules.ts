import * as text from "../../../../kit/text.js";
import { RollingNudgeMapping } from "./rolling-nudge-mapping.js";

/** A rule a rolling nudge mapping must pass. Check returns its problems, or none. */
export interface RollingNudgeMappingRule {
  check(item: RollingNudgeMapping): string[];
}

export class RollingNudgeMappingRequiredTitleRule implements RollingNudgeMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingNudgeMapping): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RollingNudgeMappingRequiredCodeRule implements RollingNudgeMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingNudgeMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingNudgeMappingTitleLengthRule implements RollingNudgeMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingNudgeMapping): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingNudgeMappingCodeLengthRule implements RollingNudgeMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingNudgeMapping): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingNudgeMappingCodePrefixRule implements RollingNudgeMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingNudgeMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingNudgeMappingAllowedCountryRule implements RollingNudgeMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingNudgeMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is blocked`];
    return [];
  }
}

/** Runs every rule of a rolling nudge mapping. */
export class RollingNudgeMappingValidator {
  rules: RollingNudgeMappingRule[];

  constructor(rules: RollingNudgeMappingRule[]) {
    this.rules = rules;
  }

  validate(item: RollingNudgeMapping): string[] {
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

  requireValid(item: RollingNudgeMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingNudgeMapping[]): Map<string, string[]> {
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

export function defaultRollingNudgeMappingValidator(): RollingNudgeMappingValidator {
  return new RollingNudgeMappingValidator(
    [
      new RollingNudgeMappingRequiredTitleRule("rolling nudge mapping needs a value"),
      new RollingNudgeMappingRequiredCodeRule("rolling nudge mapping needs a value"),
      new RollingNudgeMappingTitleLengthRule(64),
      new RollingNudgeMappingCodeLengthRule(16),
      new RollingNudgeMappingCodePrefixRule("OPS"),
      new RollingNudgeMappingAllowedCountryRule(["tiered", "tiered"]),
    ],
  );
}
