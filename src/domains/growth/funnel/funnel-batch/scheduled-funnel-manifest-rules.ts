import { ScheduledFunnelManifest } from "./scheduled-funnel-manifest.js";

/** A rule a scheduled funnel manifest must pass. Check returns its problems, or none. */
export interface ScheduledFunnelManifestRule {
  check(item: ScheduledFunnelManifest): string[];
}

export class ScheduledFunnelManifestMinimumRangeRule implements ScheduledFunnelManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledFunnelManifest): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ScheduledFunnelManifestRequiredCodeRule implements ScheduledFunnelManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledFunnelManifest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledFunnelManifestScoreRangeRule implements ScheduledFunnelManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledFunnelManifest): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a scheduled funnel manifest. */
export class ScheduledFunnelManifestValidator {
  rules: ScheduledFunnelManifestRule[];

  constructor(rules: ScheduledFunnelManifestRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledFunnelManifest): string[] {
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

  requireValid(item: ScheduledFunnelManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledFunnelManifest[]): Map<string, string[]> {
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

export function defaultScheduledFunnelManifestValidator(): ScheduledFunnelManifestValidator {
  return new ScheduledFunnelManifestValidator(
    [
      new ScheduledFunnelManifestMinimumRangeRule(6.5, 3164.6),
      new ScheduledFunnelManifestRequiredCodeRule("scheduled funnel manifest needs an entry"),
      new ScheduledFunnelManifestScoreRangeRule(0.8, 749.9),
    ],
  );
}
