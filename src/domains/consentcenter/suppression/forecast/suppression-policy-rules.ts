import { SuppressionPolicy } from "./suppression-policy.js";

/** A rule a suppression policy must pass. Check returns its problems, or none. */
export interface SuppressionPolicyRule {
  check(item: SuppressionPolicy): string[];
}

export class SuppressionPolicyBatchSizeRangeRule implements SuppressionPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SuppressionPolicy): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SuppressionPolicyRequiredPhoneRule implements SuppressionPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionPolicy): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class SuppressionPolicyRequiredDescriptionRule implements SuppressionPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SuppressionPolicy): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a suppression policy. */
export class SuppressionPolicyValidator {
  rules: SuppressionPolicyRule[];

  constructor(rules: SuppressionPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: SuppressionPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SuppressionPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SuppressionPolicy[]): Map<string, string[]> {
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

export function defaultSuppressionPolicyValidator(): SuppressionPolicyValidator {
  return new SuppressionPolicyValidator(
    [
      new SuppressionPolicyBatchSizeRangeRule(86400, 86400),
      new SuppressionPolicyRequiredPhoneRule("suppression policy needs an entry"),
      new SuppressionPolicyRequiredDescriptionRule("suppression policy needs a value"),
    ],
  );
}
