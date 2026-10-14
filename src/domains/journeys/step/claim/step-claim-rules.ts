import { StepClaim } from "./step-claim.js";

/** A rule a step claim must pass. Check returns its problems, or none. */
export interface StepClaimRule {
  check(item: StepClaim): string[];
}

export class StepClaimUtmSourceLengthRule implements StepClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepClaim): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepClaimRequiredUtmSourceRule implements StepClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepClaim): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class StepClaimCodePrefixRule implements StepClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StepClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StepClaimCapacityRangeRule implements StepClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepClaim): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StepClaimLabelLengthRule implements StepClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepClaim): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepClaimAttemptsRangeRule implements StepClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepClaim): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a step claim. */
export class StepClaimValidator {
  rules: StepClaimRule[];

  constructor(rules: StepClaimRule[]) {
    this.rules = rules;
  }

  validate(item: StepClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StepClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepClaim[]): Map<string, string[]> {
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

export function defaultStepClaimValidator(): StepClaimValidator {
  return new StepClaimValidator(
    [
      new StepClaimUtmSourceLengthRule(80),
      new StepClaimRequiredUtmSourceRule("step claim needs an entry"),
      new StepClaimCodePrefixRule("ACM"),
      new StepClaimCapacityRangeRule(16, 16),
      new StepClaimLabelLengthRule(16),
      new StepClaimAttemptsRangeRule(80, 120),
    ],
  );
}
