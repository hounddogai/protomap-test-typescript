import { LevelManifest } from "./level-manifest.js";

/** A rule a level manifest must pass. Check returns its problems, or none. */
export interface LevelManifestRule {
  check(item: LevelManifest): string[];
}

export class LevelManifestRequiredExternalRefRule implements LevelManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelManifest): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class LevelManifestAmountRangeRule implements LevelManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LevelManifest): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LevelManifestRegionLengthRule implements LevelManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelManifest): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a level manifest. */
export class LevelManifestValidator {
  rules: LevelManifestRule[];

  constructor(rules: LevelManifestRule[]) {
    this.rules = rules;
  }

  validate(item: LevelManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LevelManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelManifest[]): Map<string, string[]> {
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

export function defaultLevelManifestValidator(): LevelManifestValidator {
  return new LevelManifestValidator(
    [
      new LevelManifestRequiredExternalRefRule("level manifest needs a value"),
      new LevelManifestAmountRangeRule(8.6, 4516.2),
      new LevelManifestRegionLengthRule(32),
    ],
  );
}
