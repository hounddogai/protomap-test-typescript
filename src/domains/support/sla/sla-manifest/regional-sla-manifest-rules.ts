import { RegionalSlaManifest } from "./regional-sla-manifest.js";

/** A rule a regional sla manifest must pass. Check returns its problems, or none. */
export interface RegionalSlaManifestRule {
  check(item: RegionalSlaManifest): string[];
}

export class RegionalSlaManifestCodeLengthRule implements RegionalSlaManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalSlaManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalSlaManifestAttemptsRangeRule implements RegionalSlaManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalSlaManifest): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalSlaManifestRequiredCodeRule implements RegionalSlaManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalSlaManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalSlaManifestReviewerLengthRule implements RegionalSlaManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalSlaManifest): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalSlaManifestRequiredReviewerRule implements RegionalSlaManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalSlaManifest): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional sla manifest. */
export class RegionalSlaManifestValidator {
  rules: RegionalSlaManifestRule[];

  constructor(rules: RegionalSlaManifestRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalSlaManifest): string[] {
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

  requireValid(item: RegionalSlaManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalSlaManifest[]): Map<string, string[]> {
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

export function defaultRegionalSlaManifestValidator(): RegionalSlaManifestValidator {
  return new RegionalSlaManifestValidator(
    [
      new RegionalSlaManifestCodeLengthRule(120),
      new RegionalSlaManifestAttemptsRangeRule(80, 120),
      new RegionalSlaManifestRequiredCodeRule("regional sla manifest needs this field"),
      new RegionalSlaManifestReviewerLengthRule(64),
      new RegionalSlaManifestRequiredReviewerRule("regional sla manifest needs a value"),
    ],
  );
}
