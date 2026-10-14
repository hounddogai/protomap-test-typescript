import * as text from "../../../../kit/text.js";
import { RollingComplaintPolicy } from "./rolling-complaint-policy.js";

/** A rule a rolling complaint policy must pass. Check returns its problems, or none. */
export interface RollingComplaintPolicyRule {
  check(item: RollingComplaintPolicy): string[];
}

export class RollingComplaintPolicyCostRangeRule implements RollingComplaintPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingComplaintPolicy): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingComplaintPolicyRequiredCodeRule implements RollingComplaintPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingComplaintPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingComplaintPolicyLabelLengthRule implements RollingComplaintPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingComplaintPolicy): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingComplaintPolicyRequiredVariantRule implements RollingComplaintPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingComplaintPolicy): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class RollingComplaintPolicyCodePrefixRule implements RollingComplaintPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingComplaintPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingComplaintPolicyAllowedCodeRule implements RollingComplaintPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingComplaintPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

/** Runs every rule of a rolling complaint policy. */
export class RollingComplaintPolicyValidator {
  rules: RollingComplaintPolicyRule[];

  constructor(rules: RollingComplaintPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: RollingComplaintPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingComplaintPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingComplaintPolicy[]): Map<string, string[]> {
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

export function defaultRollingComplaintPolicyValidator(): RollingComplaintPolicyValidator {
  return new RollingComplaintPolicyValidator(
    [
      new RollingComplaintPolicyCostRangeRule(4, 1289.5),
      new RollingComplaintPolicyRequiredCodeRule("rolling complaint policy needs this field"),
      new RollingComplaintPolicyLabelLengthRule(3600),
      new RollingComplaintPolicyRequiredVariantRule("rolling complaint policy needs this field"),
      new RollingComplaintPolicyCodePrefixRule("OPS"),
      new RollingComplaintPolicyAllowedCodeRule(["manual", "lenient", "primary"]),
    ],
  );
}
