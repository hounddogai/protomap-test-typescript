import * as text from "../../../../kit/text.js";
import { LegacyDeflectionRule } from "./legacy-deflection-rule.js";

/** A rule a legacy deflection rule must pass. Check returns its problems, or none. */
export interface LegacyDeflectionRuleRule {
  check(item: LegacyDeflectionRule): string[];
}

export class LegacyDeflectionRuleSequenceRangeRule implements LegacyDeflectionRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyDeflectionRule): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyDeflectionRuleRequiredTitleRule implements LegacyDeflectionRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyDeflectionRule): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyDeflectionRuleCapacityRangeRule implements LegacyDeflectionRuleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyDeflectionRule): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyDeflectionRuleRequiredCohortRule implements LegacyDeflectionRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyDeflectionRule): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyDeflectionRuleAllowedCountryRule implements LegacyDeflectionRuleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyDeflectionRule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is too long`];
    return [];
  }
}

/** Runs every rule of a legacy deflection rule. */
export class LegacyDeflectionRuleValidator {
  rules: LegacyDeflectionRuleRule[];

  constructor(rules: LegacyDeflectionRuleRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyDeflectionRule): string[] {
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

  requireValid(item: LegacyDeflectionRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyDeflectionRule[]): Map<string, string[]> {
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

export function defaultLegacyDeflectionRuleValidator(): LegacyDeflectionRuleValidator {
  return new LegacyDeflectionRuleValidator(
    [
      new LegacyDeflectionRuleSequenceRangeRule(80, 120),
      new LegacyDeflectionRuleRequiredTitleRule("legacy deflection rule needs an entry"),
      new LegacyDeflectionRuleCapacityRangeRule(16, 1000),
      new LegacyDeflectionRuleRequiredCohortRule("legacy deflection rule needs this field"),
      new LegacyDeflectionRuleAllowedCountryRule(["primary", "default"]),
    ],
  );
}
