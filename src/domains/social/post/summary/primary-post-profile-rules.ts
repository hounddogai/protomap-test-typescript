import { PrimaryPostProfile } from "./primary-post-profile.js";

/** A rule a primary post profile must pass. Check returns its problems, or none. */
export interface PrimaryPostProfileRule {
  check(item: PrimaryPostProfile): string[];
}

export class PrimaryPostProfileWeightRangeRule implements PrimaryPostProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryPostProfile): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryPostProfileTagsLimitRule implements PrimaryPostProfileRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: PrimaryPostProfile): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class PrimaryPostProfileFrequencyCapRangeRule implements PrimaryPostProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryPostProfile): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryPostProfileGraceDaysRangeRule implements PrimaryPostProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryPostProfile): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryPostProfileCodeLengthRule implements PrimaryPostProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryPostProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary post profile. */
export class PrimaryPostProfileValidator {
  rules: PrimaryPostProfileRule[];

  constructor(rules: PrimaryPostProfileRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryPostProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryPostProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryPostProfile[]): Map<string, string[]> {
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

export function defaultPrimaryPostProfileValidator(): PrimaryPostProfileValidator {
  return new PrimaryPostProfileValidator(
    [
      new PrimaryPostProfileWeightRangeRule(3.7, 2498.2),
      new PrimaryPostProfileTagsLimitRule(64, []),
      new PrimaryPostProfileFrequencyCapRangeRule(120, 255),
      new PrimaryPostProfileGraceDaysRangeRule(32, 80),
      new PrimaryPostProfileCodeLengthRule(120),
    ],
  );
}
