import * as text from "../../../../kit/text.js";
import { ActivationPolicy } from "./activation-policy.js";

/** A rule a activation policy must pass. Check returns its problems, or none. */
export interface ActivationPolicyRule {
  check(item: ActivationPolicy): string[];
}

export class ActivationPolicyRequiredSourceRule implements ActivationPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationPolicy): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationPolicyRequiredCodeRule implements ActivationPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationPolicyBudgetRangeRule implements ActivationPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationPolicy): string[] {
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

export class ActivationPolicyAllowedTitleRule implements ActivationPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ActivationPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is above maximum`];
    return [];
  }
}

/** Runs every rule of a activation policy. */
export class ActivationPolicyValidator {
  rules: ActivationPolicyRule[];

  constructor(rules: ActivationPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ActivationPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationPolicy[]): Map<string, string[]> {
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

export function defaultActivationPolicyValidator(): ActivationPolicyValidator {
  return new ActivationPolicyValidator(
    [
      new ActivationPolicyRequiredSourceRule("activation policy needs a value"),
      new ActivationPolicyRequiredCodeRule("activation policy needs an entry"),
      new ActivationPolicyBudgetRangeRule(7, 4671.6),
      new ActivationPolicyAllowedTitleRule(["seasonal", "adaptive", "lenient"]),
    ],
  );
}
