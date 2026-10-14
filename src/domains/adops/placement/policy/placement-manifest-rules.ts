import { PlacementManifest } from "./placement-manifest.js";

/** A rule a placement manifest must pass. Check returns its problems, or none. */
export interface PlacementManifestRule {
  check(item: PlacementManifest): string[];
}

export class PlacementManifestClicksRangeRule implements PlacementManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementManifest): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PlacementManifestRequiredTitleRule implements PlacementManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementManifest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementManifestOpenRateRangeRule implements PlacementManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementManifest): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a placement manifest. */
export class PlacementManifestValidator {
  rules: PlacementManifestRule[];

  constructor(rules: PlacementManifestRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementManifest): string[] {
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

  requireValid(item: PlacementManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementManifest[]): Map<string, string[]> {
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

export function defaultPlacementManifestValidator(): PlacementManifestValidator {
  return new PlacementManifestValidator(
    [
      new PlacementManifestClicksRangeRule(80, 86400),
      new PlacementManifestRequiredTitleRule("placement manifest needs an entry"),
      new PlacementManifestOpenRateRangeRule(6.1, 522.5),
    ],
  );
}
