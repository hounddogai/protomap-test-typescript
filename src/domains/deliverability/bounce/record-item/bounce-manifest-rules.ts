import { BounceManifest } from "./bounce-manifest.js";

/** A rule a bounce manifest must pass. Check returns its problems, or none. */
export interface BounceManifestRule {
  check(item: BounceManifest): string[];
}

export class BounceManifestFrequencyCapRangeRule implements BounceManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BounceManifest): string[] {
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

export class BounceManifestNameLengthRule implements BounceManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceManifest): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BounceManifestCodeLengthRule implements BounceManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a bounce manifest. */
export class BounceManifestValidator {
  rules: BounceManifestRule[];

  constructor(rules: BounceManifestRule[]) {
    this.rules = rules;
  }

  validate(item: BounceManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BounceManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BounceManifest[]): Map<string, string[]> {
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

export function defaultBounceManifestValidator(): BounceManifestValidator {
  return new BounceManifestValidator(
    [
      new BounceManifestFrequencyCapRangeRule(80, 120),
      new BounceManifestNameLengthRule(120),
      new BounceManifestCodeLengthRule(3600),
    ],
  );
}
