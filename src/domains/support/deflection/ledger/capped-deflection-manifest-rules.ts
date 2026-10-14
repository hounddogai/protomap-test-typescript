import { CappedDeflectionManifest } from "./capped-deflection-manifest.js";

/** A rule a capped deflection manifest must pass. Check returns its problems, or none. */
export interface CappedDeflectionManifestRule {
  check(item: CappedDeflectionManifest): string[];
}

export class CappedDeflectionManifestAmountRangeRule implements CappedDeflectionManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedDeflectionManifest): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedDeflectionManifestLabelLengthRule implements CappedDeflectionManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedDeflectionManifest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedDeflectionManifestTitleLengthRule implements CappedDeflectionManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedDeflectionManifest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped deflection manifest. */
export class CappedDeflectionManifestValidator {
  rules: CappedDeflectionManifestRule[];

  constructor(rules: CappedDeflectionManifestRule[]) {
    this.rules = rules;
  }

  validate(item: CappedDeflectionManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedDeflectionManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedDeflectionManifest[]): Map<string, string[]> {
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

export function defaultCappedDeflectionManifestValidator(): CappedDeflectionManifestValidator {
  return new CappedDeflectionManifestValidator(
    [
      new CappedDeflectionManifestAmountRangeRule(5.6, 4179.9),
      new CappedDeflectionManifestLabelLengthRule(3600),
      new CappedDeflectionManifestTitleLengthRule(64),
    ],
  );
}
