import * as text from "../../../../kit/text.js";
import { RollingSenderPlan } from "./rolling-sender-plan.js";

/** A rule a rolling sender plan must pass. Check returns its problems, or none. */
export interface RollingSenderPlanRule {
  check(item: RollingSenderPlan): string[];
}

export class RollingSenderPlanTimezoneLengthRule implements RollingSenderPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingSenderPlan): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingSenderPlanRequiredNotesRule implements RollingSenderPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingSenderPlan): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class RollingSenderPlanCodePrefixRule implements RollingSenderPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingSenderPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingSenderPlanRevisionRangeRule implements RollingSenderPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingSenderPlan): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingSenderPlanAllowedCodeRule implements RollingSenderPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingSenderPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

export class RollingSenderPlanRequiredCodeRule implements RollingSenderPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingSenderPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling sender plan. */
export class RollingSenderPlanValidator {
  rules: RollingSenderPlanRule[];

  constructor(rules: RollingSenderPlanRule[]) {
    this.rules = rules;
  }

  validate(item: RollingSenderPlan): string[] {
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

  requireValid(item: RollingSenderPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingSenderPlan[]): Map<string, string[]> {
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

export function defaultRollingSenderPlanValidator(): RollingSenderPlanValidator {
  return new RollingSenderPlanValidator(
    [
      new RollingSenderPlanTimezoneLengthRule(255),
      new RollingSenderPlanRequiredNotesRule("rolling sender plan needs a value"),
      new RollingSenderPlanCodePrefixRule("OPS"),
      new RollingSenderPlanRevisionRangeRule(16, 64),
      new RollingSenderPlanAllowedCodeRule(["seasonal", "tiered"]),
      new RollingSenderPlanRequiredCodeRule("rolling sender plan needs this field"),
    ],
  );
}
