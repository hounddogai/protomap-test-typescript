import { SeasonalFunnelManifest } from "./seasonal-funnel-manifest.js";

/** A rule a seasonal funnel manifest must pass. Check returns its problems, or none. */
export interface SeasonalFunnelManifestRule {
  check(item: SeasonalFunnelManifest): string[];
}

export class SeasonalFunnelManifestRequiredTitleRule implements SeasonalFunnelManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalFunnelManifest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalFunnelManifestRequiredJourneyIdRule implements SeasonalFunnelManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalFunnelManifest): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalFunnelManifestTitleLengthRule implements SeasonalFunnelManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalFunnelManifest): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalFunnelManifestCodeLengthRule implements SeasonalFunnelManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalFunnelManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal funnel manifest. */
export class SeasonalFunnelManifestValidator {
  rules: SeasonalFunnelManifestRule[];

  constructor(rules: SeasonalFunnelManifestRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalFunnelManifest): string[] {
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

  requireValid(item: SeasonalFunnelManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalFunnelManifest[]): Map<string, string[]> {
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

export function defaultSeasonalFunnelManifestValidator(): SeasonalFunnelManifestValidator {
  return new SeasonalFunnelManifestValidator(
    [
      new SeasonalFunnelManifestRequiredTitleRule("seasonal funnel manifest needs this field"),
      new SeasonalFunnelManifestRequiredJourneyIdRule("seasonal funnel manifest needs this field"),
      new SeasonalFunnelManifestTitleLengthRule(255),
      new SeasonalFunnelManifestCodeLengthRule(120),
    ],
  );
}
