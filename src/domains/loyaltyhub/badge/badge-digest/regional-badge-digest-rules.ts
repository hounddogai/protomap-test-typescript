import { RegionalBadgeDigest } from "./regional-badge-digest.js";

/** A rule a regional badge digest must pass. Check returns its problems, or none. */
export interface RegionalBadgeDigestRule {
  check(item: RegionalBadgeDigest): string[];
}

export class RegionalBadgeDigestCodePrefixRule implements RegionalBadgeDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RegionalBadgeDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RegionalBadgeDigestRequiredNameRule implements RegionalBadgeDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalBadgeDigest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalBadgeDigestLocaleLengthRule implements RegionalBadgeDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalBadgeDigest): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional badge digest. */
export class RegionalBadgeDigestValidator {
  rules: RegionalBadgeDigestRule[];

  constructor(rules: RegionalBadgeDigestRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalBadgeDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalBadgeDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalBadgeDigest[]): Map<string, string[]> {
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

export function defaultRegionalBadgeDigestValidator(): RegionalBadgeDigestValidator {
  return new RegionalBadgeDigestValidator(
    [
      new RegionalBadgeDigestCodePrefixRule("OPS"),
      new RegionalBadgeDigestRequiredNameRule("regional badge digest needs an entry"),
      new RegionalBadgeDigestLocaleLengthRule(80),
    ],
  );
}
