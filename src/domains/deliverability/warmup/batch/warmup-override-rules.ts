import * as text from "../../../../kit/text.js";
import { WarmupOverride } from "./warmup-override.js";

/** A rule a warmup override must pass. Check returns its problems, or none. */
export interface WarmupOverrideRule {
  check(item: WarmupOverride): string[];
}

export class WarmupOverrideAllowedNameRule implements WarmupOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WarmupOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is not allowed`];
    return [];
  }
}

export class WarmupOverrideCurrencyLengthRule implements WarmupOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WarmupOverride): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WarmupOverrideRequiredCurrencyRule implements WarmupOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupOverride): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a warmup override. */
export class WarmupOverrideValidator {
  rules: WarmupOverrideRule[];

  constructor(rules: WarmupOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupOverride): string[] {
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

  requireValid(item: WarmupOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupOverride[]): Map<string, string[]> {
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

export function defaultWarmupOverrideValidator(): WarmupOverrideValidator {
  return new WarmupOverrideValidator(
    [
      new WarmupOverrideAllowedNameRule([]),
      new WarmupOverrideCurrencyLengthRule(120),
      new WarmupOverrideRequiredCurrencyRule("warmup override needs a value"),
    ],
  );
}
