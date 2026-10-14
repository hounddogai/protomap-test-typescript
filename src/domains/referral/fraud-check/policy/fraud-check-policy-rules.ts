import { FraudCheckPolicy } from "./fraud-check-policy.js";

/** A rule a fraud check policy must pass. Check returns its problems, or none. */
export interface FraudCheckPolicyRule {
  check(item: FraudCheckPolicy): string[];
}

export class FraudCheckPolicyRequiredSegmentRule implements FraudCheckPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckPolicy): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckPolicySegmentLengthRule implements FraudCheckPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckPolicy): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckPolicyTitleLengthRule implements FraudCheckPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckPolicy): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckPolicyCodePrefixRule implements FraudCheckPolicyRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FraudCheckPolicy): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FraudCheckPolicyRequiredTitleRule implements FraudCheckPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckPolicy): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckPolicyRequiredCodeRule implements FraudCheckPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckPolicy): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fraud check policy. */
export class FraudCheckPolicyValidator {
  rules: FraudCheckPolicyRule[];

  constructor(rules: FraudCheckPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckPolicy): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FraudCheckPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckPolicy[]): Map<string, string[]> {
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

export function defaultFraudCheckPolicyValidator(): FraudCheckPolicyValidator {
  return new FraudCheckPolicyValidator(
    [
      new FraudCheckPolicyRequiredSegmentRule("fraud check policy needs this field"),
      new FraudCheckPolicySegmentLengthRule(120),
      new FraudCheckPolicyTitleLengthRule(3600),
      new FraudCheckPolicyCodePrefixRule("OPS"),
      new FraudCheckPolicyRequiredTitleRule("fraud check policy needs a value"),
      new FraudCheckPolicyRequiredCodeRule("fraud check policy needs an entry"),
    ],
  );
}
