import * as text from "../../../../kit/text.js";
import { ScheduledActivationManifest } from "./scheduled-activation-manifest.js";

/** A rule a scheduled activation manifest must pass. Check returns its problems, or none. */
export interface ScheduledActivationManifestRule {
  check(item: ScheduledActivationManifest): string[];
}

export class ScheduledActivationManifestCodePrefixRule implements ScheduledActivationManifestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledActivationManifest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledActivationManifestMinimumRangeRule implements ScheduledActivationManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledActivationManifest): string[] {
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

export class ScheduledActivationManifestCampaignRefLengthRule implements ScheduledActivationManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledActivationManifest): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledActivationManifestAllowedTitleRule implements ScheduledActivationManifestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledActivationManifest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is blocked`];
    return [];
  }
}

export class ScheduledActivationManifestLimitRangeRule implements ScheduledActivationManifestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledActivationManifest): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a scheduled activation manifest. */
export class ScheduledActivationManifestValidator {
  rules: ScheduledActivationManifestRule[];

  constructor(rules: ScheduledActivationManifestRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledActivationManifest): string[] {
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

  requireValid(item: ScheduledActivationManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledActivationManifest[]): Map<string, string[]> {
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

export function defaultScheduledActivationManifestValidator(): ScheduledActivationManifestValidator {
  return new ScheduledActivationManifestValidator(
    [
      new ScheduledActivationManifestCodePrefixRule("REF"),
      new ScheduledActivationManifestMinimumRangeRule(6.2, 4834.3),
      new ScheduledActivationManifestCampaignRefLengthRule(3600),
      new ScheduledActivationManifestAllowedTitleRule(["scheduled", "manual", "strict"]),
      new ScheduledActivationManifestLimitRangeRule(32, 120),
    ],
  );
}
