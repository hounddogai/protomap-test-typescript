import { TieredFrequencyManifest } from "./tiered-frequency-manifest.js";

/** A rule a tiered frequency manifest must pass. Check returns its problems, or none. */
export interface TieredFrequencyManifestRule {
  check(item: TieredFrequencyManifest): string[];
}

export class TieredFrequencyManifestCeilingRangeRule implements TieredFrequencyManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredFrequencyManifest): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredFrequencyManifestRequiredSourceRule implements TieredFrequencyManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredFrequencyManifest): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class TieredFrequencyManifestNameLengthRule implements TieredFrequencyManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredFrequencyManifest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredFrequencyManifestStartsAtRangeRule implements TieredFrequencyManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredFrequencyManifest): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredFrequencyManifestCodeLengthRule implements TieredFrequencyManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredFrequencyManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredFrequencyManifestAttemptsRangeRule implements TieredFrequencyManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredFrequencyManifest): string[] {
    const value = item.attempts;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`attempts ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`attempts ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a tiered frequency manifest. */
export class TieredFrequencyManifestValidator {
  rules: TieredFrequencyManifestRule[];

  constructor(rules: TieredFrequencyManifestRule[]) {
    this.rules = rules;
  }

  validate(item: TieredFrequencyManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredFrequencyManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredFrequencyManifest[]): Map<string, string[]> {
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

export function defaultTieredFrequencyManifestValidator(): TieredFrequencyManifestValidator {
  return new TieredFrequencyManifestValidator(
    [
      new TieredFrequencyManifestCeilingRangeRule(4.7, 4201.5),
      new TieredFrequencyManifestRequiredSourceRule("tiered frequency manifest needs this field"),
      new TieredFrequencyManifestNameLengthRule(16),
      new TieredFrequencyManifestStartsAtRangeRule(64, 64),
      new TieredFrequencyManifestCodeLengthRule(80),
      new TieredFrequencyManifestAttemptsRangeRule(16, 255),
    ],
  );
}
