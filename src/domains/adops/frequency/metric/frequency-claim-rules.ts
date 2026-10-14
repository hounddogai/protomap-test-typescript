import * as text from "../../../../kit/text.js";
import { FrequencyClaim } from "./frequency-claim.js";

/** A rule a frequency claim must pass. Check returns its problems, or none. */
export interface FrequencyClaimRule {
  check(item: FrequencyClaim): string[];
}

export class FrequencyClaimRequiredLocaleRule implements FrequencyClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FrequencyClaim): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class FrequencyClaimSourceLengthRule implements FrequencyClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyClaim): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyClaimLocaleLengthRule implements FrequencyClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FrequencyClaim): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FrequencyClaimBatchSizeRangeRule implements FrequencyClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyClaim): string[] {
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

export class FrequencyClaimBudgetRangeRule implements FrequencyClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FrequencyClaim): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FrequencyClaimAllowedSourceRule implements FrequencyClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FrequencyClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is missing`];
    return [];
  }
}

/** Runs every rule of a frequency claim. */
export class FrequencyClaimValidator {
  rules: FrequencyClaimRule[];

  constructor(rules: FrequencyClaimRule[]) {
    this.rules = rules;
  }

  validate(item: FrequencyClaim): string[] {
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

  requireValid(item: FrequencyClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FrequencyClaim[]): Map<string, string[]> {
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

export function defaultFrequencyClaimValidator(): FrequencyClaimValidator {
  return new FrequencyClaimValidator(
    [
      new FrequencyClaimRequiredLocaleRule("frequency claim needs an entry"),
      new FrequencyClaimSourceLengthRule(255),
      new FrequencyClaimLocaleLengthRule(80),
      new FrequencyClaimBatchSizeRangeRule(32, 3600),
      new FrequencyClaimBudgetRangeRule(3, 579.2),
      new FrequencyClaimAllowedSourceRule(["seasonal", "manual", "strict"]),
    ],
  );
}
