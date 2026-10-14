import { CohortManifest } from "./cohort-manifest.js";

/** A rule a cohort manifest must pass. Check returns its problems, or none. */
export interface CohortManifestRule {
  check(item: CohortManifest): string[];
}

export class CohortManifestRequiredLabelRule implements CohortManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortManifest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class CohortManifestCostRangeRule implements CohortManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortManifest): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CohortManifestCreatedAtRangeRule implements CohortManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortManifest): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CohortManifestRegionLengthRule implements CohortManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortManifest): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a cohort manifest. */
export class CohortManifestValidator {
  rules: CohortManifestRule[];

  constructor(rules: CohortManifestRule[]) {
    this.rules = rules;
  }

  validate(item: CohortManifest): string[] {
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

  requireValid(item: CohortManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortManifest[]): Map<string, string[]> {
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

export function defaultCohortManifestValidator(): CohortManifestValidator {
  return new CohortManifestValidator(
    [
      new CohortManifestRequiredLabelRule("cohort manifest needs this field"),
      new CohortManifestCostRangeRule(2.7, 1739.3),
      new CohortManifestCreatedAtRangeRule(1000, 86400),
      new CohortManifestRegionLengthRule(120),
    ],
  );
}
