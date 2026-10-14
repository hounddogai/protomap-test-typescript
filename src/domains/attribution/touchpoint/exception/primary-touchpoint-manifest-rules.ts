import { PrimaryTouchpointManifest } from "./primary-touchpoint-manifest.js";

/** A rule a primary touchpoint manifest must pass. Check returns its problems, or none. */
export interface PrimaryTouchpointManifestRule {
  check(item: PrimaryTouchpointManifest): string[];
}

export class PrimaryTouchpointManifestRequiredCodeRule implements PrimaryTouchpointManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryTouchpointManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryTouchpointManifestArchivedGuardRule implements PrimaryTouchpointManifestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PrimaryTouchpointManifest): string[] {
    if (item.archived && item.openRate > this.limit) return [`open rate ${item.openRate} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class PrimaryTouchpointManifestOpenRateRangeRule implements PrimaryTouchpointManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryTouchpointManifest): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a primary touchpoint manifest. */
export class PrimaryTouchpointManifestValidator {
  rules: PrimaryTouchpointManifestRule[];

  constructor(rules: PrimaryTouchpointManifestRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryTouchpointManifest): string[] {
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

  requireValid(item: PrimaryTouchpointManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryTouchpointManifest[]): Map<string, string[]> {
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

export function defaultPrimaryTouchpointManifestValidator(): PrimaryTouchpointManifestValidator {
  return new PrimaryTouchpointManifestValidator(
    [
      new PrimaryTouchpointManifestRequiredCodeRule("primary touchpoint manifest needs an entry"),
      new PrimaryTouchpointManifestArchivedGuardRule(0.9),
      new PrimaryTouchpointManifestOpenRateRangeRule(9.2, 3463.1),
    ],
  );
}
