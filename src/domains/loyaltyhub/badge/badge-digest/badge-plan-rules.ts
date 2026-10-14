import * as text from "../../../../kit/text.js";
import { BadgePlan } from "./badge-plan.js";

/** A rule a badge plan must pass. Check returns its problems, or none. */
export interface BadgePlanRule {
  check(item: BadgePlan): string[];
}

export class BadgePlanAllowedLocaleRule implements BadgePlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BadgePlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is inconsistent`];
    return [];
  }
}

export class BadgePlanChannelLengthRule implements BadgePlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgePlan): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgePlanRequiredChannelRule implements BadgePlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgePlan): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class BadgePlanLocaleLengthRule implements BadgePlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgePlan): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a badge plan. */
export class BadgePlanValidator {
  rules: BadgePlanRule[];

  constructor(rules: BadgePlanRule[]) {
    this.rules = rules;
  }

  validate(item: BadgePlan): string[] {
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

  requireValid(item: BadgePlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgePlan[]): Map<string, string[]> {
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

export function defaultBadgePlanValidator(): BadgePlanValidator {
  return new BadgePlanValidator(
    [
      new BadgePlanAllowedLocaleRule(["tiered", "lenient"]),
      new BadgePlanChannelLengthRule(80),
      new BadgePlanRequiredChannelRule("badge plan needs a value"),
      new BadgePlanLocaleLengthRule(80),
    ],
  );
}
