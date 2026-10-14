import { SeasonalReputationDigest } from "./seasonal-reputation-digest.js";

/** A rule a seasonal reputation digest must pass. Check returns its problems, or none. */
export interface SeasonalReputationDigestRule {
  check(item: SeasonalReputationDigest): string[];
}

export class SeasonalReputationDigestRequiredUtmSourceRule implements SeasonalReputationDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalReputationDigest): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalReputationDigestRequiredChecksumRule implements SeasonalReputationDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalReputationDigest): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalReputationDigestUtmSourceLengthRule implements SeasonalReputationDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalReputationDigest): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalReputationDigestCodePrefixRule implements SeasonalReputationDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalReputationDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalReputationDigestRequiredCodeRule implements SeasonalReputationDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalReputationDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal reputation digest. */
export class SeasonalReputationDigestValidator {
  rules: SeasonalReputationDigestRule[];

  constructor(rules: SeasonalReputationDigestRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalReputationDigest): string[] {
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

  requireValid(item: SeasonalReputationDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalReputationDigest[]): Map<string, string[]> {
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

export function defaultSeasonalReputationDigestValidator(): SeasonalReputationDigestValidator {
  return new SeasonalReputationDigestValidator(
    [
      new SeasonalReputationDigestRequiredUtmSourceRule("seasonal reputation digest needs a value"),
      new SeasonalReputationDigestRequiredChecksumRule("seasonal reputation digest needs this field"),
      new SeasonalReputationDigestUtmSourceLengthRule(16),
      new SeasonalReputationDigestCodePrefixRule("REF"),
      new SeasonalReputationDigestRequiredCodeRule("seasonal reputation digest needs a value"),
    ],
  );
}
