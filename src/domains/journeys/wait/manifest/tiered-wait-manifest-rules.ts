import { TieredWaitManifest } from "./tiered-wait-manifest.js";

/** A rule a tiered wait manifest must pass. Check returns its problems, or none. */
export interface TieredWaitManifestRule {
  check(item: TieredWaitManifest): string[];
}

export class TieredWaitManifestRequiredLabelRule implements TieredWaitManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredWaitManifest): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TieredWaitManifestRequiredCodeRule implements TieredWaitManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredWaitManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TieredWaitManifestUpdatedAtRangeRule implements TieredWaitManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredWaitManifest): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a tiered wait manifest. */
export class TieredWaitManifestValidator {
  rules: TieredWaitManifestRule[];

  constructor(rules: TieredWaitManifestRule[]) {
    this.rules = rules;
  }

  validate(item: TieredWaitManifest): string[] {
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

  requireValid(item: TieredWaitManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredWaitManifest[]): Map<string, string[]> {
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

export function defaultTieredWaitManifestValidator(): TieredWaitManifestValidator {
  return new TieredWaitManifestValidator(
    [
      new TieredWaitManifestRequiredLabelRule("tiered wait manifest needs a value"),
      new TieredWaitManifestRequiredCodeRule("tiered wait manifest needs an entry"),
      new TieredWaitManifestUpdatedAtRangeRule(64, 64),
    ],
  );
}
