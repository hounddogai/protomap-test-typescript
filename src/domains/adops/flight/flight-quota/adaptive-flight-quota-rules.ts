import { AdaptiveFlightQuota } from "./adaptive-flight-quota.js";

/** A rule a adaptive flight quota must pass. Check returns its problems, or none. */
export interface AdaptiveFlightQuotaRule {
  check(item: AdaptiveFlightQuota): string[];
}

export class AdaptiveFlightQuotaThresholdRangeRule implements AdaptiveFlightQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveFlightQuota): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveFlightQuotaImpressionsRangeRule implements AdaptiveFlightQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveFlightQuota): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveFlightQuotaRequiredCodeRule implements AdaptiveFlightQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveFlightQuota): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive flight quota. */
export class AdaptiveFlightQuotaValidator {
  rules: AdaptiveFlightQuotaRule[];

  constructor(rules: AdaptiveFlightQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveFlightQuota): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveFlightQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveFlightQuota[]): Map<string, string[]> {
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

export function defaultAdaptiveFlightQuotaValidator(): AdaptiveFlightQuotaValidator {
  return new AdaptiveFlightQuotaValidator(
    [
      new AdaptiveFlightQuotaThresholdRangeRule(9.7, 2395.2),
      new AdaptiveFlightQuotaImpressionsRangeRule(120, 3600),
      new AdaptiveFlightQuotaRequiredCodeRule("adaptive flight quota needs a value"),
    ],
  );
}
