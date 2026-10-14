import * as text from "../../../../kit/text.js";
import { DefaultWarmupOverride } from "./default-warmup-override.js";

/** A rule a default warmup override must pass. Check returns its problems, or none. */
export interface DefaultWarmupOverrideRule {
  check(item: DefaultWarmupOverride): string[];
}

export class DefaultWarmupOverrideCountryLengthRule implements DefaultWarmupOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultWarmupOverride): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultWarmupOverrideBudgetRangeRule implements DefaultWarmupOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultWarmupOverride): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultWarmupOverrideRequiredCountryRule implements DefaultWarmupOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultWarmupOverride): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultWarmupOverrideAllowedCodeRule implements DefaultWarmupOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultWarmupOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class DefaultWarmupOverrideNameLengthRule implements DefaultWarmupOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultWarmupOverride): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultWarmupOverrideClicksRangeRule implements DefaultWarmupOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultWarmupOverride): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a default warmup override. */
export class DefaultWarmupOverrideValidator {
  rules: DefaultWarmupOverrideRule[];

  constructor(rules: DefaultWarmupOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultWarmupOverride): string[] {
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

  requireValid(item: DefaultWarmupOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultWarmupOverride[]): Map<string, string[]> {
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

export function defaultDefaultWarmupOverrideValidator(): DefaultWarmupOverrideValidator {
  return new DefaultWarmupOverrideValidator(
    [
      new DefaultWarmupOverrideCountryLengthRule(86400),
      new DefaultWarmupOverrideBudgetRangeRule(1.9, 3234.2),
      new DefaultWarmupOverrideRequiredCountryRule("default warmup override needs a value"),
      new DefaultWarmupOverrideAllowedCodeRule(["legacy", "seasonal", "fallback"]),
      new DefaultWarmupOverrideNameLengthRule(32),
      new DefaultWarmupOverrideClicksRangeRule(16, 64),
    ],
  );
}
