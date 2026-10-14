import { EnrollmentManifest } from "./enrollment-manifest.js";

/** A rule a enrollment manifest must pass. Check returns its problems, or none. */
export interface EnrollmentManifestRule {
  check(item: EnrollmentManifest): string[];
}

export class EnrollmentManifestRequiredNameRule implements EnrollmentManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentManifest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentManifestCodePrefixRule implements EnrollmentManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EnrollmentManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class EnrollmentManifestApprovedGuardRule implements EnrollmentManifestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: EnrollmentManifest): string[] {
    if (item.approved && item.startsAt > this.limit) return [`starts at ${item.startsAt} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class EnrollmentManifestDiscountRangeRule implements EnrollmentManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentManifest): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class EnrollmentManifestRetriesRangeRule implements EnrollmentManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentManifest): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class EnrollmentManifestUpdatedAtRangeRule implements EnrollmentManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentManifest): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a enrollment manifest. */
export class EnrollmentManifestValidator {
  rules: EnrollmentManifestRule[];

  constructor(rules: EnrollmentManifestRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EnrollmentManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentManifest[]): Map<string, string[]> {
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

export function defaultEnrollmentManifestValidator(): EnrollmentManifestValidator {
  return new EnrollmentManifestValidator(
    [
      new EnrollmentManifestRequiredNameRule("enrollment manifest needs an entry"),
      new EnrollmentManifestCodePrefixRule("ACM"),
      new EnrollmentManifestApprovedGuardRule(86400),
      new EnrollmentManifestDiscountRangeRule(6.9, 1519.5),
      new EnrollmentManifestRetriesRangeRule(255, 3600),
      new EnrollmentManifestUpdatedAtRangeRule(1000, 86400),
    ],
  );
}
