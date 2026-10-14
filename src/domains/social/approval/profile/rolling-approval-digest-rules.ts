import { RollingApprovalDigest } from "./rolling-approval-digest.js";

/** A rule a rolling approval digest must pass. Check returns its problems, or none. */
export interface RollingApprovalDigestRule {
  check(item: RollingApprovalDigest): string[];
}

export class RollingApprovalDigestRatioRangeRule implements RollingApprovalDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingApprovalDigest): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingApprovalDigestCodePrefixRule implements RollingApprovalDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingApprovalDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingApprovalDigestChannelLengthRule implements RollingApprovalDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingApprovalDigest): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingApprovalDigestQuantityRangeRule implements RollingApprovalDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingApprovalDigest): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingApprovalDigestSegmentLengthRule implements RollingApprovalDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingApprovalDigest): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling approval digest. */
export class RollingApprovalDigestValidator {
  rules: RollingApprovalDigestRule[];

  constructor(rules: RollingApprovalDigestRule[]) {
    this.rules = rules;
  }

  validate(item: RollingApprovalDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingApprovalDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingApprovalDigest[]): Map<string, string[]> {
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

export function defaultRollingApprovalDigestValidator(): RollingApprovalDigestValidator {
  return new RollingApprovalDigestValidator(
    [
      new RollingApprovalDigestRatioRangeRule(5.8, 2286.3),
      new RollingApprovalDigestCodePrefixRule("REF"),
      new RollingApprovalDigestChannelLengthRule(80),
      new RollingApprovalDigestQuantityRangeRule(120, 255),
      new RollingApprovalDigestSegmentLengthRule(3600),
    ],
  );
}
