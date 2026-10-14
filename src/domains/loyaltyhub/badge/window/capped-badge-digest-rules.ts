import { CappedBadgeDigest } from "./capped-badge-digest.js";

/** A rule a capped badge digest must pass. Check returns its problems, or none. */
export interface CappedBadgeDigestRule {
  check(item: CappedBadgeDigest): string[];
}

export class CappedBadgeDigestAttemptsRangeRule implements CappedBadgeDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedBadgeDigest): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedBadgeDigestVersionRangeRule implements CappedBadgeDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedBadgeDigest): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedBadgeDigestRequiredNameRule implements CappedBadgeDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedBadgeDigest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CappedBadgeDigestCodePrefixRule implements CappedBadgeDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedBadgeDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a capped badge digest. */
export class CappedBadgeDigestValidator {
  rules: CappedBadgeDigestRule[];

  constructor(rules: CappedBadgeDigestRule[]) {
    this.rules = rules;
  }

  validate(item: CappedBadgeDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedBadgeDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedBadgeDigest[]): Map<string, string[]> {
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

export function defaultCappedBadgeDigestValidator(): CappedBadgeDigestValidator {
  return new CappedBadgeDigestValidator(
    [
      new CappedBadgeDigestAttemptsRangeRule(64, 3600),
      new CappedBadgeDigestVersionRangeRule(80, 1000),
      new CappedBadgeDigestRequiredNameRule("capped badge digest needs this field"),
      new CappedBadgeDigestCodePrefixRule("OPS"),
    ],
  );
}
