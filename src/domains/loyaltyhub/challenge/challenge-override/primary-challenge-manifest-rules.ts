import { PrimaryChallengeManifest } from "./primary-challenge-manifest.js";

/** A rule a primary challenge manifest must pass. Check returns its problems, or none. */
export interface PrimaryChallengeManifestRule {
  check(item: PrimaryChallengeManifest): string[];
}

export class PrimaryChallengeManifestRequiredCategoryRule implements PrimaryChallengeManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryChallengeManifest): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryChallengeManifestThresholdRangeRule implements PrimaryChallengeManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryChallengeManifest): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryChallengeManifestNameLengthRule implements PrimaryChallengeManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryChallengeManifest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryChallengeManifestCodeLengthRule implements PrimaryChallengeManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryChallengeManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryChallengeManifestRequiredCodeRule implements PrimaryChallengeManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryChallengeManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryChallengeManifestRequiredContactEmailRule implements PrimaryChallengeManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryChallengeManifest): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary challenge manifest. */
export class PrimaryChallengeManifestValidator {
  rules: PrimaryChallengeManifestRule[];

  constructor(rules: PrimaryChallengeManifestRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryChallengeManifest): string[] {
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

  requireValid(item: PrimaryChallengeManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryChallengeManifest[]): Map<string, string[]> {
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

export function defaultPrimaryChallengeManifestValidator(): PrimaryChallengeManifestValidator {
  return new PrimaryChallengeManifestValidator(
    [
      new PrimaryChallengeManifestRequiredCategoryRule("primary challenge manifest needs an entry"),
      new PrimaryChallengeManifestThresholdRangeRule(0.4, 2670.5),
      new PrimaryChallengeManifestNameLengthRule(80),
      new PrimaryChallengeManifestCodeLengthRule(64),
      new PrimaryChallengeManifestRequiredCodeRule("primary challenge manifest needs an entry"),
      new PrimaryChallengeManifestRequiredContactEmailRule("primary challenge manifest needs this field"),
    ],
  );
}
