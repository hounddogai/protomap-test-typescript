import { RegionalSuppressionManifest } from "./regional-suppression-manifest.js";

/** A rule a regional suppression manifest must pass. Check returns its problems, or none. */
export interface RegionalSuppressionManifestRule {
  check(item: RegionalSuppressionManifest): string[];
}

export class RegionalSuppressionManifestWeightRangeRule implements RegionalSuppressionManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalSuppressionManifest): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalSuppressionManifestRequiredSourceRule implements RegionalSuppressionManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalSuppressionManifest): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalSuppressionManifestSequenceRangeRule implements RegionalSuppressionManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalSuppressionManifest): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalSuppressionManifestRequiredCampaignRefRule implements RegionalSuppressionManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalSuppressionManifest): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional suppression manifest. */
export class RegionalSuppressionManifestValidator {
  rules: RegionalSuppressionManifestRule[];

  constructor(rules: RegionalSuppressionManifestRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalSuppressionManifest): string[] {
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

  requireValid(item: RegionalSuppressionManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalSuppressionManifest[]): Map<string, string[]> {
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

export function defaultRegionalSuppressionManifestValidator(): RegionalSuppressionManifestValidator {
  return new RegionalSuppressionManifestValidator(
    [
      new RegionalSuppressionManifestWeightRangeRule(4.4, 2104.7),
      new RegionalSuppressionManifestRequiredSourceRule("regional suppression manifest needs an entry"),
      new RegionalSuppressionManifestSequenceRangeRule(16, 3600),
      new RegionalSuppressionManifestRequiredCampaignRefRule("regional suppression manifest needs a value"),
    ],
  );
}
