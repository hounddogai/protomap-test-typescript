import { WindowClaim } from "./window-claim.js";

/** A rule a window claim must pass. Check returns its problems, or none. */
export interface WindowClaimRule {
  check(item: WindowClaim): string[];
}

export class WindowClaimExternalRefLengthRule implements WindowClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WindowClaim): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WindowClaimCodePrefixRule implements WindowClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WindowClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WindowClaimMinimumRangeRule implements WindowClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WindowClaim): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WindowClaimRequiredExternalRefRule implements WindowClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowClaim): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a window claim. */
export class WindowClaimValidator {
  rules: WindowClaimRule[];

  constructor(rules: WindowClaimRule[]) {
    this.rules = rules;
  }

  validate(item: WindowClaim): string[] {
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

  requireValid(item: WindowClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowClaim[]): Map<string, string[]> {
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

export function defaultWindowClaimValidator(): WindowClaimValidator {
  return new WindowClaimValidator(
    [
      new WindowClaimExternalRefLengthRule(16),
      new WindowClaimCodePrefixRule("X"),
      new WindowClaimMinimumRangeRule(2.5, 3804.2),
      new WindowClaimRequiredExternalRefRule("window claim needs this field"),
    ],
  );
}
