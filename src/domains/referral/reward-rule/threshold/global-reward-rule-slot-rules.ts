import * as text from "../../../../kit/text.js";
import { GlobalRewardRuleSlot } from "./global-reward-rule-slot.js";

/** A rule a global reward rule slot must pass. Check returns its problems, or none. */
export interface GlobalRewardRuleSlotRule {
  check(item: GlobalRewardRuleSlot): string[];
}

export class GlobalRewardRuleSlotRequiredCodeRule implements GlobalRewardRuleSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRewardRuleSlot): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalRewardRuleSlotRequiredJourneyIdRule implements GlobalRewardRuleSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRewardRuleSlot): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalRewardRuleSlotRequiredNameRule implements GlobalRewardRuleSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRewardRuleSlot): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalRewardRuleSlotAllowedContactEmailRule implements GlobalRewardRuleSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalRewardRuleSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is stale`];
    return [];
  }
}

export class GlobalRewardRuleSlotExpiresAtRangeRule implements GlobalRewardRuleSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalRewardRuleSlot): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalRewardRuleSlotCodeLengthRule implements GlobalRewardRuleSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalRewardRuleSlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global reward rule slot. */
export class GlobalRewardRuleSlotValidator {
  rules: GlobalRewardRuleSlotRule[];

  constructor(rules: GlobalRewardRuleSlotRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalRewardRuleSlot): string[] {
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

  requireValid(item: GlobalRewardRuleSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalRewardRuleSlot[]): Map<string, string[]> {
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

export function defaultGlobalRewardRuleSlotValidator(): GlobalRewardRuleSlotValidator {
  return new GlobalRewardRuleSlotValidator(
    [
      new GlobalRewardRuleSlotRequiredCodeRule("global reward rule slot needs an entry"),
      new GlobalRewardRuleSlotRequiredJourneyIdRule("global reward rule slot needs an entry"),
      new GlobalRewardRuleSlotRequiredNameRule("global reward rule slot needs a value"),
      new GlobalRewardRuleSlotAllowedContactEmailRule(["pending"]),
      new GlobalRewardRuleSlotExpiresAtRangeRule(64, 1000),
      new GlobalRewardRuleSlotCodeLengthRule(120),
    ],
  );
}
