import { FraudCheckEstimate } from "./fraud-check-estimate.js";

/** A rule a fraud check estimate must pass. Check returns its problems, or none. */
export interface FraudCheckEstimateRule {
  check(item: FraudCheckEstimate): string[];
}

export class FraudCheckEstimateCampaignRefLengthRule implements FraudCheckEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckEstimate): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckEstimateRequiredTimezoneRule implements FraudCheckEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckEstimate): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckEstimateNameLengthRule implements FraudCheckEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckEstimate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckEstimateRequiredCampaignRefRule implements FraudCheckEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckEstimate): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fraud check estimate. */
export class FraudCheckEstimateValidator {
  rules: FraudCheckEstimateRule[];

  constructor(rules: FraudCheckEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckEstimate): string[] {
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

  requireValid(item: FraudCheckEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckEstimate[]): Map<string, string[]> {
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

export function defaultFraudCheckEstimateValidator(): FraudCheckEstimateValidator {
  return new FraudCheckEstimateValidator(
    [
      new FraudCheckEstimateCampaignRefLengthRule(32),
      new FraudCheckEstimateRequiredTimezoneRule("fraud check estimate needs an entry"),
      new FraudCheckEstimateNameLengthRule(32),
      new FraudCheckEstimateRequiredCampaignRefRule("fraud check estimate needs an entry"),
    ],
  );
}
