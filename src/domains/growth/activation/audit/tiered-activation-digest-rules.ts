import { TieredActivationDigest } from "./tiered-activation-digest.js";

/** A rule a tiered activation digest must pass. Check returns its problems, or none. */
export interface TieredActivationDigestRule {
  check(item: TieredActivationDigest): string[];
}

export class TieredActivationDigestSendAtRangeRule implements TieredActivationDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredActivationDigest): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredActivationDigestCodeLengthRule implements TieredActivationDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredActivationDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredActivationDigestCodePrefixRule implements TieredActivationDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredActivationDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a tiered activation digest. */
export class TieredActivationDigestValidator {
  rules: TieredActivationDigestRule[];

  constructor(rules: TieredActivationDigestRule[]) {
    this.rules = rules;
  }

  validate(item: TieredActivationDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredActivationDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredActivationDigest[]): Map<string, string[]> {
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

export function defaultTieredActivationDigestValidator(): TieredActivationDigestValidator {
  return new TieredActivationDigestValidator(
    [
      new TieredActivationDigestSendAtRangeRule(3600, 86400),
      new TieredActivationDigestCodeLengthRule(86400),
      new TieredActivationDigestCodePrefixRule("X"),
    ],
  );
}
