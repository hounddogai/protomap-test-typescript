import { FallbackFunnelEstimate } from "./fallback-funnel-estimate.js";

/** A rule a fallback funnel estimate must pass. Check returns its problems, or none. */
export interface FallbackFunnelEstimateRule {
  check(item: FallbackFunnelEstimate): string[];
}

export class FallbackFunnelEstimateCurrencyLengthRule implements FallbackFunnelEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackFunnelEstimate): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackFunnelEstimateRequiredLabelRule implements FallbackFunnelEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackFunnelEstimate): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackFunnelEstimateAudienceIdLengthRule implements FallbackFunnelEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackFunnelEstimate): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackFunnelEstimateLabelLengthRule implements FallbackFunnelEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackFunnelEstimate): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackFunnelEstimateCodeLengthRule implements FallbackFunnelEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackFunnelEstimate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackFunnelEstimateRequiredCurrencyRule implements FallbackFunnelEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackFunnelEstimate): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback funnel estimate. */
export class FallbackFunnelEstimateValidator {
  rules: FallbackFunnelEstimateRule[];

  constructor(rules: FallbackFunnelEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackFunnelEstimate): string[] {
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

  requireValid(item: FallbackFunnelEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackFunnelEstimate[]): Map<string, string[]> {
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

export function defaultFallbackFunnelEstimateValidator(): FallbackFunnelEstimateValidator {
  return new FallbackFunnelEstimateValidator(
    [
      new FallbackFunnelEstimateCurrencyLengthRule(64),
      new FallbackFunnelEstimateRequiredLabelRule("fallback funnel estimate needs an entry"),
      new FallbackFunnelEstimateAudienceIdLengthRule(1000),
      new FallbackFunnelEstimateLabelLengthRule(86400),
      new FallbackFunnelEstimateCodeLengthRule(255),
      new FallbackFunnelEstimateRequiredCurrencyRule("fallback funnel estimate needs an entry"),
    ],
  );
}
