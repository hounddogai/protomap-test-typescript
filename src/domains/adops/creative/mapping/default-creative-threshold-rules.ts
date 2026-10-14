import * as text from "../../../../kit/text.js";
import { DefaultCreativeThreshold } from "./default-creative-threshold.js";

/** A rule a default creative threshold must pass. Check returns its problems, or none. */
export interface DefaultCreativeThresholdRule {
  check(item: DefaultCreativeThreshold): string[];
}

export class DefaultCreativeThresholdAllowedCodeRule implements DefaultCreativeThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultCreativeThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

export class DefaultCreativeThresholdOpenRateRangeRule implements DefaultCreativeThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultCreativeThreshold): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultCreativeThresholdRequiredExternalRefRule implements DefaultCreativeThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultCreativeThreshold): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultCreativeThresholdRequiredLabelRule implements DefaultCreativeThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultCreativeThreshold): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a default creative threshold. */
export class DefaultCreativeThresholdValidator {
  rules: DefaultCreativeThresholdRule[];

  constructor(rules: DefaultCreativeThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultCreativeThreshold): string[] {
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

  requireValid(item: DefaultCreativeThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultCreativeThreshold[]): Map<string, string[]> {
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

export function defaultDefaultCreativeThresholdValidator(): DefaultCreativeThresholdValidator {
  return new DefaultCreativeThresholdValidator(
    [
      new DefaultCreativeThresholdAllowedCodeRule([]),
      new DefaultCreativeThresholdOpenRateRangeRule(7.5, 4207.4),
      new DefaultCreativeThresholdRequiredExternalRefRule("default creative threshold needs an entry"),
      new DefaultCreativeThresholdRequiredLabelRule("default creative threshold needs this field"),
    ],
  );
}
