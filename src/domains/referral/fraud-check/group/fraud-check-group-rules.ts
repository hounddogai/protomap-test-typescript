import * as text from "../../../../kit/text.js";
import { FraudCheckGroup } from "./fraud-check-group.js";

/** A rule a fraud check group must pass. Check returns its problems, or none. */
export interface FraudCheckGroupRule {
  check(item: FraudCheckGroup): string[];
}

export class FraudCheckGroupRequiredCodeRule implements FraudCheckGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckGroupCampaignRefLengthRule implements FraudCheckGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckGroup): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckGroupCodeLengthRule implements FraudCheckGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckGroup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckGroupAllowedCodeRule implements FraudCheckGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FraudCheckGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

/** Runs every rule of a fraud check group. */
export class FraudCheckGroupValidator {
  rules: FraudCheckGroupRule[];

  constructor(rules: FraudCheckGroupRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FraudCheckGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckGroup[]): Map<string, string[]> {
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

export function defaultFraudCheckGroupValidator(): FraudCheckGroupValidator {
  return new FraudCheckGroupValidator(
    [
      new FraudCheckGroupRequiredCodeRule("fraud check group needs an entry"),
      new FraudCheckGroupCampaignRefLengthRule(16),
      new FraudCheckGroupCodeLengthRule(80),
      new FraudCheckGroupAllowedCodeRule(["batched", "lenient"]),
    ],
  );
}
