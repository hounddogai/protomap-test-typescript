import * as text from "../../../../kit/text.js";
import { ReputationProfile } from "./reputation-profile.js";

/** A rule a reputation profile must pass. Check returns its problems, or none. */
export interface ReputationProfileRule {
  check(item: ReputationProfile): string[];
}

export class ReputationProfileCodeLengthRule implements ReputationProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ReputationProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ReputationProfileAllowedContactEmailRule implements ReputationProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ReputationProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is too long`];
    return [];
  }
}

export class ReputationProfileRequiredRegionRule implements ReputationProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ReputationProfile): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a reputation profile. */
export class ReputationProfileValidator {
  rules: ReputationProfileRule[];

  constructor(rules: ReputationProfileRule[]) {
    this.rules = rules;
  }

  validate(item: ReputationProfile): string[] {
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

  requireValid(item: ReputationProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ReputationProfile[]): Map<string, string[]> {
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

export function defaultReputationProfileValidator(): ReputationProfileValidator {
  return new ReputationProfileValidator(
    [
      new ReputationProfileCodeLengthRule(64),
      new ReputationProfileAllowedContactEmailRule([]),
      new ReputationProfileRequiredRegionRule("reputation profile needs this field"),
    ],
  );
}
