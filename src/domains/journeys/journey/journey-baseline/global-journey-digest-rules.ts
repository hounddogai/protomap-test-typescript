import * as text from "../../../../kit/text.js";
import { GlobalJourneyDigest } from "./global-journey-digest.js";

/** A rule a global journey digest must pass. Check returns its problems, or none. */
export interface GlobalJourneyDigestRule {
  check(item: GlobalJourneyDigest): string[];
}

export class GlobalJourneyDigestChannelLengthRule implements GlobalJourneyDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalJourneyDigest): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalJourneyDigestAllowedChannelRule implements GlobalJourneyDigestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalJourneyDigest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is blocked`];
    return [];
  }
}

export class GlobalJourneyDigestCodeLengthRule implements GlobalJourneyDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalJourneyDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global journey digest. */
export class GlobalJourneyDigestValidator {
  rules: GlobalJourneyDigestRule[];

  constructor(rules: GlobalJourneyDigestRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalJourneyDigest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalJourneyDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalJourneyDigest[]): Map<string, string[]> {
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

export function defaultGlobalJourneyDigestValidator(): GlobalJourneyDigestValidator {
  return new GlobalJourneyDigestValidator(
    [
      new GlobalJourneyDigestChannelLengthRule(80),
      new GlobalJourneyDigestAllowedChannelRule([]),
      new GlobalJourneyDigestCodeLengthRule(86400),
    ],
  );
}
