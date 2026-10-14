import * as text from "../../../../kit/text.js";
import { LegacyFraudCheckEstimate } from "./legacy-fraud-check-estimate.js";

/** A rule a legacy fraud check estimate must pass. Check returns its problems, or none. */
export interface LegacyFraudCheckEstimateRule {
  check(item: LegacyFraudCheckEstimate): string[];
}

export class LegacyFraudCheckEstimateCapacityRangeRule implements LegacyFraudCheckEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyFraudCheckEstimate): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyFraudCheckEstimateAllowedDescriptionRule implements LegacyFraudCheckEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyFraudCheckEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is duplicated`];
    return [];
  }
}

export class LegacyFraudCheckEstimateCodeLengthRule implements LegacyFraudCheckEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyFraudCheckEstimate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyFraudCheckEstimateRequiredOwnerIdRule implements LegacyFraudCheckEstimateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyFraudCheckEstimate): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyFraudCheckEstimateVersionRangeRule implements LegacyFraudCheckEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyFraudCheckEstimate): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a legacy fraud check estimate. */
export class LegacyFraudCheckEstimateValidator {
  rules: LegacyFraudCheckEstimateRule[];

  constructor(rules: LegacyFraudCheckEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyFraudCheckEstimate): string[] {
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

  requireValid(item: LegacyFraudCheckEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyFraudCheckEstimate[]): Map<string, string[]> {
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

export function defaultLegacyFraudCheckEstimateValidator(): LegacyFraudCheckEstimateValidator {
  return new LegacyFraudCheckEstimateValidator(
    [
      new LegacyFraudCheckEstimateCapacityRangeRule(80, 1000),
      new LegacyFraudCheckEstimateAllowedDescriptionRule(["lenient", "legacy"]),
      new LegacyFraudCheckEstimateCodeLengthRule(86400),
      new LegacyFraudCheckEstimateRequiredOwnerIdRule("legacy fraud check estimate needs this field"),
      new LegacyFraudCheckEstimateVersionRangeRule(64, 120),
    ],
  );
}
