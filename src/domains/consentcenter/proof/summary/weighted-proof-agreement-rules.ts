import * as text from "../../../../kit/text.js";
import { WeightedProofAgreement } from "./weighted-proof-agreement.js";

/** A rule a weighted proof agreement must pass. Check returns its problems, or none. */
export interface WeightedProofAgreementRule {
  check(item: WeightedProofAgreement): string[];
}

export class WeightedProofAgreementAllowedCampaignRefRule implements WeightedProofAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedProofAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is above maximum`];
    return [];
  }
}

export class WeightedProofAgreementApprovedGuardRule implements WeightedProofAgreementRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: WeightedProofAgreement): string[] {
    if (item.approved && item.capacity > this.limit) return [`capacity ${item.capacity} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class WeightedProofAgreementRequiredLabelRule implements WeightedProofAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedProofAgreement): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted proof agreement. */
export class WeightedProofAgreementValidator {
  rules: WeightedProofAgreementRule[];

  constructor(rules: WeightedProofAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedProofAgreement): string[] {
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

  requireValid(item: WeightedProofAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedProofAgreement[]): Map<string, string[]> {
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

export function defaultWeightedProofAgreementValidator(): WeightedProofAgreementValidator {
  return new WeightedProofAgreementValidator(
    [
      new WeightedProofAgreementAllowedCampaignRefRule(["adaptive", "seasonal", "seasonal"]),
      new WeightedProofAgreementApprovedGuardRule(1000),
      new WeightedProofAgreementRequiredLabelRule("weighted proof agreement needs an entry"),
    ],
  );
}
