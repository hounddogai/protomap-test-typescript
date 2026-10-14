import { RollingJourneyAgreement } from "./rolling-journey-agreement.js";

/** A rule a rolling journey agreement must pass. Check returns its problems, or none. */
export interface RollingJourneyAgreementRule {
  check(item: RollingJourneyAgreement): string[];
}

export class RollingJourneyAgreementCodeLengthRule implements RollingJourneyAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingJourneyAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingJourneyAgreementRequiredCampaignRefRule implements RollingJourneyAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingJourneyAgreement): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class RollingJourneyAgreementBatchSizeRangeRule implements RollingJourneyAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingJourneyAgreement): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingJourneyAgreementRequiredTitleRule implements RollingJourneyAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingJourneyAgreement): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RollingJourneyAgreementCampaignRefLengthRule implements RollingJourneyAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingJourneyAgreement): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling journey agreement. */
export class RollingJourneyAgreementValidator {
  rules: RollingJourneyAgreementRule[];

  constructor(rules: RollingJourneyAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: RollingJourneyAgreement): string[] {
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

  requireValid(item: RollingJourneyAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingJourneyAgreement[]): Map<string, string[]> {
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

export function defaultRollingJourneyAgreementValidator(): RollingJourneyAgreementValidator {
  return new RollingJourneyAgreementValidator(
    [
      new RollingJourneyAgreementCodeLengthRule(1000),
      new RollingJourneyAgreementRequiredCampaignRefRule("rolling journey agreement needs an entry"),
      new RollingJourneyAgreementBatchSizeRangeRule(64, 255),
      new RollingJourneyAgreementRequiredTitleRule("rolling journey agreement needs this field"),
      new RollingJourneyAgreementCampaignRefLengthRule(80),
    ],
  );
}
