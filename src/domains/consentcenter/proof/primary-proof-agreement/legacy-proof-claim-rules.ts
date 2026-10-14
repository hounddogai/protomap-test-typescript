import * as text from "../../../../kit/text.js";
import { LegacyProofClaim } from "./legacy-proof-claim.js";

/** A rule a legacy proof claim must pass. Check returns its problems, or none. */
export interface LegacyProofClaimRule {
  check(item: LegacyProofClaim): string[];
}

export class LegacyProofClaimCodePrefixRule implements LegacyProofClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyProofClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyProofClaimAllowedNameRule implements LegacyProofClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyProofClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is expired`];
    return [];
  }
}

export class LegacyProofClaimAudienceIdLengthRule implements LegacyProofClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyProofClaim): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a legacy proof claim. */
export class LegacyProofClaimValidator {
  rules: LegacyProofClaimRule[];

  constructor(rules: LegacyProofClaimRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyProofClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyProofClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyProofClaim[]): Map<string, string[]> {
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

export function defaultLegacyProofClaimValidator(): LegacyProofClaimValidator {
  return new LegacyProofClaimValidator(
    [
      new LegacyProofClaimCodePrefixRule("REF"),
      new LegacyProofClaimAllowedNameRule([]),
      new LegacyProofClaimAudienceIdLengthRule(1000),
    ],
  );
}
