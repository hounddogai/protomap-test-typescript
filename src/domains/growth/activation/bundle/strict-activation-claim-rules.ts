import { StrictActivationClaim } from "./strict-activation-claim.js";

/** A rule a strict activation claim must pass. Check returns its problems, or none. */
export interface StrictActivationClaimRule {
  check(item: StrictActivationClaim): string[];
}

export class StrictActivationClaimRequiredCodeRule implements StrictActivationClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictActivationClaim): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictActivationClaimTitleLengthRule implements StrictActivationClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictActivationClaim): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictActivationClaimCeilingRangeRule implements StrictActivationClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictActivationClaim): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictActivationClaimCodeLengthRule implements StrictActivationClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictActivationClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictActivationClaimRequiredTitleRule implements StrictActivationClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictActivationClaim): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StrictActivationClaimChannelLengthRule implements StrictActivationClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictActivationClaim): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict activation claim. */
export class StrictActivationClaimValidator {
  rules: StrictActivationClaimRule[];

  constructor(rules: StrictActivationClaimRule[]) {
    this.rules = rules;
  }

  validate(item: StrictActivationClaim): string[] {
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

  requireValid(item: StrictActivationClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictActivationClaim[]): Map<string, string[]> {
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

export function defaultStrictActivationClaimValidator(): StrictActivationClaimValidator {
  return new StrictActivationClaimValidator(
    [
      new StrictActivationClaimRequiredCodeRule("strict activation claim needs a value"),
      new StrictActivationClaimTitleLengthRule(32),
      new StrictActivationClaimCeilingRangeRule(2.8, 4202.9),
      new StrictActivationClaimCodeLengthRule(32),
      new StrictActivationClaimRequiredTitleRule("strict activation claim needs this field"),
      new StrictActivationClaimChannelLengthRule(255),
    ],
  );
}
