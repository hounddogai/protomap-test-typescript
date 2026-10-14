import * as text from "../../../../kit/text.js";
import { StrictRewardRuleManifest } from "./strict-reward-rule-manifest.js";

/** A rule a strict reward rule manifest must pass. Check returns its problems, or none. */
export interface StrictRewardRuleManifestRule {
  check(item: StrictRewardRuleManifest): string[];
}

export class StrictRewardRuleManifestAllowedLabelRule implements StrictRewardRuleManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictRewardRuleManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is out of range`];
    return [];
  }
}

export class StrictRewardRuleManifestRequiredLabelRule implements StrictRewardRuleManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictRewardRuleManifest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class StrictRewardRuleManifestFloorValueRangeRule implements StrictRewardRuleManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictRewardRuleManifest): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictRewardRuleManifestLabelLengthRule implements StrictRewardRuleManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictRewardRuleManifest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictRewardRuleManifestExternalRefLengthRule implements StrictRewardRuleManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictRewardRuleManifest): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict reward rule manifest. */
export class StrictRewardRuleManifestValidator {
  rules: StrictRewardRuleManifestRule[];

  constructor(rules: StrictRewardRuleManifestRule[]) {
    this.rules = rules;
  }

  validate(item: StrictRewardRuleManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictRewardRuleManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictRewardRuleManifest[]): Map<string, string[]> {
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

export function defaultStrictRewardRuleManifestValidator(): StrictRewardRuleManifestValidator {
  return new StrictRewardRuleManifestValidator(
    [
      new StrictRewardRuleManifestAllowedLabelRule([]),
      new StrictRewardRuleManifestRequiredLabelRule("strict reward rule manifest needs a value"),
      new StrictRewardRuleManifestFloorValueRangeRule(8.2, 898.2),
      new StrictRewardRuleManifestLabelLengthRule(80),
      new StrictRewardRuleManifestExternalRefLengthRule(1000),
    ],
  );
}
