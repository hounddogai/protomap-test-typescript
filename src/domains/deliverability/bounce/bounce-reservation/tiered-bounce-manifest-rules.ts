import { TieredBounceManifest } from "./tiered-bounce-manifest.js";

/** A rule a tiered bounce manifest must pass. Check returns its problems, or none. */
export interface TieredBounceManifestRule {
  check(item: TieredBounceManifest): string[];
}

export class TieredBounceManifestRequiredSegmentRule implements TieredBounceManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredBounceManifest): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class TieredBounceManifestRequiredLocaleRule implements TieredBounceManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredBounceManifest): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class TieredBounceManifestRequiredCodeRule implements TieredBounceManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredBounceManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredBounceManifestRevisionRangeRule implements TieredBounceManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredBounceManifest): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredBounceManifestSegmentLengthRule implements TieredBounceManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredBounceManifest): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered bounce manifest. */
export class TieredBounceManifestValidator {
  rules: TieredBounceManifestRule[];

  constructor(rules: TieredBounceManifestRule[]) {
    this.rules = rules;
  }

  validate(item: TieredBounceManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredBounceManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredBounceManifest[]): Map<string, string[]> {
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

export function defaultTieredBounceManifestValidator(): TieredBounceManifestValidator {
  return new TieredBounceManifestValidator(
    [
      new TieredBounceManifestRequiredSegmentRule("tiered bounce manifest needs an entry"),
      new TieredBounceManifestRequiredLocaleRule("tiered bounce manifest needs this field"),
      new TieredBounceManifestRequiredCodeRule("tiered bounce manifest needs an entry"),
      new TieredBounceManifestRevisionRangeRule(16, 86400),
      new TieredBounceManifestSegmentLengthRule(86400),
    ],
  );
}
