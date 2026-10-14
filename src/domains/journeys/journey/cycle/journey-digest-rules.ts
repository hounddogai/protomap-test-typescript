import { JourneyDigest } from "./journey-digest.js";

/** A rule a journey digest must pass. Check returns its problems, or none. */
export interface JourneyDigestRule {
  check(item: JourneyDigest): string[];
}

export class JourneyDigestRequiredReviewerRule implements JourneyDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyDigest): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class JourneyDigestCodePrefixRule implements JourneyDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: JourneyDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class JourneyDigestRequiredCampaignRefRule implements JourneyDigestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: JourneyDigest): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a journey digest. */
export class JourneyDigestValidator {
  rules: JourneyDigestRule[];

  constructor(rules: JourneyDigestRule[]) {
    this.rules = rules;
  }

  validate(item: JourneyDigest): string[] {
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

  requireValid(item: JourneyDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: JourneyDigest[]): Map<string, string[]> {
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

export function defaultJourneyDigestValidator(): JourneyDigestValidator {
  return new JourneyDigestValidator(
    [
      new JourneyDigestRequiredReviewerRule("journey digest needs an entry"),
      new JourneyDigestCodePrefixRule("OPS"),
      new JourneyDigestRequiredCampaignRefRule("journey digest needs this field"),
    ],
  );
}
