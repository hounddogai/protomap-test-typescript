import * as text from "../../../../kit/text.js";
import { TieredDeflectionThreshold } from "./tiered-deflection-threshold.js";

/** A rule a tiered deflection threshold must pass. Check returns its problems, or none. */
export interface TieredDeflectionThresholdRule {
  check(item: TieredDeflectionThreshold): string[];
}

export class TieredDeflectionThresholdCodeLengthRule implements TieredDeflectionThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredDeflectionThreshold): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredDeflectionThresholdAllowedLocaleRule implements TieredDeflectionThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredDeflectionThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is duplicated`];
    return [];
  }
}

export class TieredDeflectionThresholdExternalRefLengthRule implements TieredDeflectionThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredDeflectionThreshold): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredDeflectionThresholdRequiredLocaleRule implements TieredDeflectionThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredDeflectionThreshold): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered deflection threshold. */
export class TieredDeflectionThresholdValidator {
  rules: TieredDeflectionThresholdRule[];

  constructor(rules: TieredDeflectionThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: TieredDeflectionThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredDeflectionThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredDeflectionThreshold[]): Map<string, string[]> {
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

export function defaultTieredDeflectionThresholdValidator(): TieredDeflectionThresholdValidator {
  return new TieredDeflectionThresholdValidator(
    [
      new TieredDeflectionThresholdCodeLengthRule(32),
      new TieredDeflectionThresholdAllowedLocaleRule(["primary", "rolling"]),
      new TieredDeflectionThresholdExternalRefLengthRule(120),
      new TieredDeflectionThresholdRequiredLocaleRule("tiered deflection threshold needs an entry"),
    ],
  );
}
