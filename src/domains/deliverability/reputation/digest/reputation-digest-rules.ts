import { ReputationDigest } from "./reputation-digest.js";

/** A rule a reputation digest must pass. Check returns its problems, or none. */
export interface ReputationDigestRule {
  check(item: ReputationDigest): string[];
}

export class ReputationDigestCodePrefixRule implements ReputationDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ReputationDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ReputationDigestRequiredCodeRule implements ReputationDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationDigest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationDigestRequiredAudienceIdRule implements ReputationDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationDigest): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class ReputationDigestLabelLengthRule implements ReputationDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationDigest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reputation digest. */
export class ReputationDigestValidator {
  rules: ReputationDigestRule[];

  constructor(rules: ReputationDigestRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationDigest): string[] {
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

  requireValid(item: ReputationDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationDigest[]): Map<string, string[]> {
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

export function defaultReputationDigestValidator(): ReputationDigestValidator {
  return new ReputationDigestValidator(
    [
      new ReputationDigestCodePrefixRule("X"),
      new ReputationDigestRequiredCodeRule("reputation digest needs a value"),
      new ReputationDigestRequiredAudienceIdRule("reputation digest needs a value"),
      new ReputationDigestLabelLengthRule(3600),
    ],
  );
}
