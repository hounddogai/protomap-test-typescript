import { ComplaintPolicy } from "./complaint-policy.js";

/** A rule a complaint policy must pass. Check returns its problems, or none. */
export interface ComplaintPolicyRule {
  check(item: ComplaintPolicy): string[];
}

export class ComplaintPolicyCodeLengthRule implements ComplaintPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintPolicyNameLengthRule implements ComplaintPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintPolicy): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintPolicyRequiredChannelRule implements ComplaintPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintPolicy): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class ComplaintPolicyImpressionsRangeRule implements ComplaintPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ComplaintPolicy): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ComplaintPolicyRequiredNameRule implements ComplaintPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintPolicy): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ComplaintPolicyTitleLengthRule implements ComplaintPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintPolicy): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a complaint policy. */
export class ComplaintPolicyValidator {
  rules: ComplaintPolicyRule[];

  constructor(rules: ComplaintPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ComplaintPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintPolicy[]): Map<string, string[]> {
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

export function defaultComplaintPolicyValidator(): ComplaintPolicyValidator {
  return new ComplaintPolicyValidator(
    [
      new ComplaintPolicyCodeLengthRule(3600),
      new ComplaintPolicyNameLengthRule(64),
      new ComplaintPolicyRequiredChannelRule("complaint policy needs this field"),
      new ComplaintPolicyImpressionsRangeRule(80, 1000),
      new ComplaintPolicyRequiredNameRule("complaint policy needs this field"),
      new ComplaintPolicyTitleLengthRule(64),
    ],
  );
}
