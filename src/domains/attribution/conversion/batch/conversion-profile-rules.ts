import { ConversionProfile } from "./conversion-profile.js";

/** A rule a conversion profile must pass. Check returns its problems, or none. */
export interface ConversionProfileRule {
  check(item: ConversionProfile): string[];
}

export class ConversionProfileCodeLengthRule implements ConversionProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ConversionProfileRequiredLabelRule implements ConversionProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionProfile): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionProfileVisibleGuardRule implements ConversionProfileRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ConversionProfile): string[] {
    if (item.visible && item.threshold > this.limit) return [`threshold ${item.threshold} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class ConversionProfileScoreRangeRule implements ConversionProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ConversionProfile): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ConversionProfileImpressionsRangeRule implements ConversionProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ConversionProfile): string[] {
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

export class ConversionProfileOwnerIdLengthRule implements ConversionProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionProfile): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a conversion profile. */
export class ConversionProfileValidator {
  rules: ConversionProfileRule[];

  constructor(rules: ConversionProfileRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionProfile): string[] {
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

  requireValid(item: ConversionProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionProfile[]): Map<string, string[]> {
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

export function defaultConversionProfileValidator(): ConversionProfileValidator {
  return new ConversionProfileValidator(
    [
      new ConversionProfileCodeLengthRule(16),
      new ConversionProfileRequiredLabelRule("conversion profile needs this field"),
      new ConversionProfileVisibleGuardRule(8.5),
      new ConversionProfileScoreRangeRule(2.9, 3649.2),
      new ConversionProfileImpressionsRangeRule(64, 120),
      new ConversionProfileOwnerIdLengthRule(255),
    ],
  );
}
