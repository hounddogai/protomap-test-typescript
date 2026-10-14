import { LegacyDeflectionManifest } from "./legacy-deflection-manifest.js";

/** A rule a legacy deflection manifest must pass. Check returns its problems, or none. */
export interface LegacyDeflectionManifestRule {
  check(item: LegacyDeflectionManifest): string[];
}

export class LegacyDeflectionManifestArchivedGuardRule implements LegacyDeflectionManifestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LegacyDeflectionManifest): string[] {
    if (item.archived && item.score > this.limit) return [`score ${item.score} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class LegacyDeflectionManifestWeightRangeRule implements LegacyDeflectionManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyDeflectionManifest): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyDeflectionManifestDiscountRangeRule implements LegacyDeflectionManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyDeflectionManifest): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyDeflectionManifestRequiredCohortRule implements LegacyDeflectionManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyDeflectionManifest): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy deflection manifest. */
export class LegacyDeflectionManifestValidator {
  rules: LegacyDeflectionManifestRule[];

  constructor(rules: LegacyDeflectionManifestRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyDeflectionManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyDeflectionManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyDeflectionManifest[]): Map<string, string[]> {
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

export function defaultLegacyDeflectionManifestValidator(): LegacyDeflectionManifestValidator {
  return new LegacyDeflectionManifestValidator(
    [
      new LegacyDeflectionManifestArchivedGuardRule(1.6),
      new LegacyDeflectionManifestWeightRangeRule(9.3, 2900.2),
      new LegacyDeflectionManifestDiscountRangeRule(0.9, 3107),
      new LegacyDeflectionManifestRequiredCohortRule("legacy deflection manifest needs an entry"),
    ],
  );
}
