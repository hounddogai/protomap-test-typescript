import { ProofPolicy } from "./proof-policy.js";

/** A rule a proof policy must pass. Check returns its problems, or none. */
export interface ProofPolicyRule {
  check(item: ProofPolicy): string[];
}

export class ProofPolicyLabelLengthRule implements ProofPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofPolicy): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofPolicyRequiredLabelRule implements ProofPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofPolicy): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ProofPolicyClicksRangeRule implements ProofPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofPolicy): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ProofPolicyAmountRangeRule implements ProofPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofPolicy): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ProofPolicyContactEmailLengthRule implements ProofPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofPolicy): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofPolicyCapacityRangeRule implements ProofPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofPolicy): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a proof policy. */
export class ProofPolicyValidator {
  rules: ProofPolicyRule[];

  constructor(rules: ProofPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: ProofPolicy): string[] {
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

  requireValid(item: ProofPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ProofPolicy[]): Map<string, string[]> {
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

export function defaultProofPolicyValidator(): ProofPolicyValidator {
  return new ProofPolicyValidator(
    [
      new ProofPolicyLabelLengthRule(1000),
      new ProofPolicyRequiredLabelRule("proof policy needs this field"),
      new ProofPolicyClicksRangeRule(255, 1000),
      new ProofPolicyAmountRangeRule(3.9, 3577.7),
      new ProofPolicyContactEmailLengthRule(120),
      new ProofPolicyCapacityRangeRule(32, 80),
    ],
  );
}
