import { RedemptionDigest } from "./redemption-digest.js";

/** A rule a redemption digest must pass. Check returns its problems, or none. */
export interface RedemptionDigestRule {
  check(item: RedemptionDigest): string[];
}

export class RedemptionDigestNameLengthRule implements RedemptionDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionDigest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionDigestRequiredLabelRule implements RedemptionDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionDigest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionDigestCodePrefixRule implements RedemptionDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RedemptionDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RedemptionDigestRequiredNameRule implements RedemptionDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionDigest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionDigestVisibleGuardRule implements RedemptionDigestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RedemptionDigest): string[] {
    if (item.visible && item.minimum > this.limit) return [`minimum ${item.minimum} exceeds ${this.limit} while visible`];
    return [];
  }
}

/** Runs every rule of a redemption digest. */
export class RedemptionDigestValidator {
  rules: RedemptionDigestRule[];

  constructor(rules: RedemptionDigestRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RedemptionDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionDigest[]): Map<string, string[]> {
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

export function defaultRedemptionDigestValidator(): RedemptionDigestValidator {
  return new RedemptionDigestValidator(
    [
      new RedemptionDigestNameLengthRule(32),
      new RedemptionDigestRequiredLabelRule("redemption digest needs a value"),
      new RedemptionDigestCodePrefixRule("REF"),
      new RedemptionDigestRequiredNameRule("redemption digest needs a value"),
      new RedemptionDigestVisibleGuardRule(3.8),
    ],
  );
}
