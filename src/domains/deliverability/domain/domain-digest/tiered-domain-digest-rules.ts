import { TieredDomainDigest } from "./tiered-domain-digest.js";

/** A rule a tiered domain digest must pass. Check returns its problems, or none. */
export interface TieredDomainDigestRule {
  check(item: TieredDomainDigest): string[];
}

export class TieredDomainDigestRequiredUtmSourceRule implements TieredDomainDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredDomainDigest): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class TieredDomainDigestSegmentLengthRule implements TieredDomainDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredDomainDigest): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredDomainDigestCodePrefixRule implements TieredDomainDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredDomainDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredDomainDigestVisibleGuardRule implements TieredDomainDigestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TieredDomainDigest): string[] {
    if (item.visible && item.openRate > this.limit) return [`open rate ${item.openRate} exceeds ${this.limit} while visible`];
    return [];
  }
}

/** Runs every rule of a tiered domain digest. */
export class TieredDomainDigestValidator {
  rules: TieredDomainDigestRule[];

  constructor(rules: TieredDomainDigestRule[]) {
    this.rules = rules;
  }

  validate(item: TieredDomainDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredDomainDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredDomainDigest[]): Map<string, string[]> {
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

export function defaultTieredDomainDigestValidator(): TieredDomainDigestValidator {
  return new TieredDomainDigestValidator(
    [
      new TieredDomainDigestRequiredUtmSourceRule("tiered domain digest needs a value"),
      new TieredDomainDigestSegmentLengthRule(64),
      new TieredDomainDigestCodePrefixRule("Q"),
      new TieredDomainDigestVisibleGuardRule(0.5),
    ],
  );
}
