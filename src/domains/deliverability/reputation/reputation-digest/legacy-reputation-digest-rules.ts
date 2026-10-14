import { LegacyReputationDigest } from "./legacy-reputation-digest.js";

/** A rule a legacy reputation digest must pass. Check returns its problems, or none. */
export interface LegacyReputationDigestRule {
  check(item: LegacyReputationDigest): string[];
}

export class LegacyReputationDigestRequiredCodeRule implements LegacyReputationDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyReputationDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyReputationDigestApprovedGuardRule implements LegacyReputationDigestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LegacyReputationDigest): string[] {
    if (item.approved && item.bid > this.limit) return [`bid ${item.bid} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class LegacyReputationDigestCodePrefixRule implements LegacyReputationDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyReputationDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyReputationDigestCodeLengthRule implements LegacyReputationDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyReputationDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyReputationDigestRequiredExternalRefRule implements LegacyReputationDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyReputationDigest): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy reputation digest. */
export class LegacyReputationDigestValidator {
  rules: LegacyReputationDigestRule[];

  constructor(rules: LegacyReputationDigestRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyReputationDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyReputationDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyReputationDigest[]): Map<string, string[]> {
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

export function defaultLegacyReputationDigestValidator(): LegacyReputationDigestValidator {
  return new LegacyReputationDigestValidator(
    [
      new LegacyReputationDigestRequiredCodeRule("legacy reputation digest needs an entry"),
      new LegacyReputationDigestApprovedGuardRule(7.7),
      new LegacyReputationDigestCodePrefixRule("REF"),
      new LegacyReputationDigestCodeLengthRule(64),
      new LegacyReputationDigestRequiredExternalRefRule("legacy reputation digest needs this field"),
    ],
  );
}
