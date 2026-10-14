import { BounceAgreement } from "./bounce-agreement.js";

/** A rule a bounce agreement must pass. Check returns its problems, or none. */
export interface BounceAgreementRule {
  check(item: BounceAgreement): string[];
}

export class BounceAgreementRequiredCodeRule implements BounceAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BounceAgreementRequiredChannelRule implements BounceAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceAgreement): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class BounceAgreementCodePrefixRule implements BounceAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BounceAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BounceAgreementUpdatedAtRangeRule implements BounceAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BounceAgreement): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BounceAgreementChannelLengthRule implements BounceAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceAgreement): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a bounce agreement. */
export class BounceAgreementValidator {
  rules: BounceAgreementRule[];

  constructor(rules: BounceAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: BounceAgreement): string[] {
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

  requireValid(item: BounceAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BounceAgreement[]): Map<string, string[]> {
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

export function defaultBounceAgreementValidator(): BounceAgreementValidator {
  return new BounceAgreementValidator(
    [
      new BounceAgreementRequiredCodeRule("bounce agreement needs this field"),
      new BounceAgreementRequiredChannelRule("bounce agreement needs this field"),
      new BounceAgreementCodePrefixRule("ACM"),
      new BounceAgreementUpdatedAtRangeRule(80, 120),
      new BounceAgreementChannelLengthRule(16),
    ],
  );
}
