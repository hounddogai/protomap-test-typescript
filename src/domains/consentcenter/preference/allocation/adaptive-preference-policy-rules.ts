import * as text from "../../../../kit/text.js";
import { AdaptivePreferencePolicy } from "./adaptive-preference-policy.js";

/** A rule a adaptive preference policy must pass. Check returns its problems, or none. */
export interface AdaptivePreferencePolicyRule {
  check(item: AdaptivePreferencePolicy): string[];
}

export class AdaptivePreferencePolicyRequiredLabelRule implements AdaptivePreferencePolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptivePreferencePolicy): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptivePreferencePolicyBudgetRangeRule implements AdaptivePreferencePolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptivePreferencePolicy): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptivePreferencePolicyAllowedChecksumRule implements AdaptivePreferencePolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptivePreferencePolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is expired`];
    return [];
  }
}

/** Runs every rule of a adaptive preference policy. */
export class AdaptivePreferencePolicyValidator {
  rules: AdaptivePreferencePolicyRule[];

  constructor(rules: AdaptivePreferencePolicyRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptivePreferencePolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptivePreferencePolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptivePreferencePolicy[]): Map<string, string[]> {
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

export function defaultAdaptivePreferencePolicyValidator(): AdaptivePreferencePolicyValidator {
  return new AdaptivePreferencePolicyValidator(
    [
      new AdaptivePreferencePolicyRequiredLabelRule("adaptive preference policy needs a value"),
      new AdaptivePreferencePolicyBudgetRangeRule(9, 1314.7),
      new AdaptivePreferencePolicyAllowedChecksumRule(["strict", "primary"]),
    ],
  );
}
