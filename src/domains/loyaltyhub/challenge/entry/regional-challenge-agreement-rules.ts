import * as text from "../../../../kit/text.js";
import { RegionalChallengeAgreement } from "./regional-challenge-agreement.js";

/** A rule a regional challenge agreement must pass. Check returns its problems, or none. */
export interface RegionalChallengeAgreementRule {
  check(item: RegionalChallengeAgreement): string[];
}

export class RegionalChallengeAgreementCampaignRefLengthRule implements RegionalChallengeAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalChallengeAgreement): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalChallengeAgreementCodeLengthRule implements RegionalChallengeAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalChallengeAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalChallengeAgreementAllowedCampaignRefRule implements RegionalChallengeAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalChallengeAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is unknown`];
    return [];
  }
}

export class RegionalChallengeAgreementNameLengthRule implements RegionalChallengeAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalChallengeAgreement): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalChallengeAgreementVariantLengthRule implements RegionalChallengeAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalChallengeAgreement): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a regional challenge agreement. */
export class RegionalChallengeAgreementValidator {
  rules: RegionalChallengeAgreementRule[];

  constructor(rules: RegionalChallengeAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalChallengeAgreement): string[] {
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

  requireValid(item: RegionalChallengeAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalChallengeAgreement[]): Map<string, string[]> {
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

export function defaultRegionalChallengeAgreementValidator(): RegionalChallengeAgreementValidator {
  return new RegionalChallengeAgreementValidator(
    [
      new RegionalChallengeAgreementCampaignRefLengthRule(16),
      new RegionalChallengeAgreementCodeLengthRule(3600),
      new RegionalChallengeAgreementAllowedCampaignRefRule(["batched", "regional"]),
      new RegionalChallengeAgreementNameLengthRule(255),
      new RegionalChallengeAgreementVariantLengthRule(80),
    ],
  );
}
