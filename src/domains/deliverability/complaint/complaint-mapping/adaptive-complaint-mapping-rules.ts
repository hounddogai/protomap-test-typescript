import * as text from "../../../../kit/text.js";
import { AdaptiveComplaintMapping } from "./adaptive-complaint-mapping.js";

/** A rule a adaptive complaint mapping must pass. Check returns its problems, or none. */
export interface AdaptiveComplaintMappingRule {
  check(item: AdaptiveComplaintMapping): string[];
}

export class AdaptiveComplaintMappingRequiredExternalRefRule implements AdaptiveComplaintMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveComplaintMapping): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveComplaintMappingJourneyIdLengthRule implements AdaptiveComplaintMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveComplaintMapping): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveComplaintMappingExternalRefLengthRule implements AdaptiveComplaintMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveComplaintMapping): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveComplaintMappingAllowedExternalRefRule implements AdaptiveComplaintMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveComplaintMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is stale`];
    return [];
  }
}

export class AdaptiveComplaintMappingMaximumRangeRule implements AdaptiveComplaintMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveComplaintMapping): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveComplaintMappingRequiredJourneyIdRule implements AdaptiveComplaintMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveComplaintMapping): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive complaint mapping. */
export class AdaptiveComplaintMappingValidator {
  rules: AdaptiveComplaintMappingRule[];

  constructor(rules: AdaptiveComplaintMappingRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveComplaintMapping): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveComplaintMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveComplaintMapping[]): Map<string, string[]> {
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

export function defaultAdaptiveComplaintMappingValidator(): AdaptiveComplaintMappingValidator {
  return new AdaptiveComplaintMappingValidator(
    [
      new AdaptiveComplaintMappingRequiredExternalRefRule("adaptive complaint mapping needs a value"),
      new AdaptiveComplaintMappingJourneyIdLengthRule(16),
      new AdaptiveComplaintMappingExternalRefLengthRule(80),
      new AdaptiveComplaintMappingAllowedExternalRefRule(["global"]),
      new AdaptiveComplaintMappingMaximumRangeRule(4.4, 1504.3),
      new AdaptiveComplaintMappingRequiredJourneyIdRule("adaptive complaint mapping needs an entry"),
    ],
  );
}
