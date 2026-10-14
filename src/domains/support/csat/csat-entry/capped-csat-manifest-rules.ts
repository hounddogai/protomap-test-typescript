import { CappedCsatManifest } from "./capped-csat-manifest.js";

/** A rule a capped csat manifest must pass. Check returns its problems, or none. */
export interface CappedCsatManifestRule {
  check(item: CappedCsatManifest): string[];
}

export class CappedCsatManifestNotesLengthRule implements CappedCsatManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedCsatManifest): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedCsatManifestUpdatedAtRangeRule implements CappedCsatManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedCsatManifest): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedCsatManifestCeilingRangeRule implements CappedCsatManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedCsatManifest): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a capped csat manifest. */
export class CappedCsatManifestValidator {
  rules: CappedCsatManifestRule[];

  constructor(rules: CappedCsatManifestRule[]) {
    this.rules = rules;
  }

  validate(item: CappedCsatManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedCsatManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedCsatManifest[]): Map<string, string[]> {
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

export function defaultCappedCsatManifestValidator(): CappedCsatManifestValidator {
  return new CappedCsatManifestValidator(
    [
      new CappedCsatManifestNotesLengthRule(64),
      new CappedCsatManifestUpdatedAtRangeRule(16, 255),
      new CappedCsatManifestCeilingRangeRule(6.3, 2350.1),
    ],
  );
}
