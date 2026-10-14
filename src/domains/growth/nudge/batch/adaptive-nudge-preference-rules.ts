import * as text from "../../../../kit/text.js";
import { AdaptiveNudgePreference } from "./adaptive-nudge-preference.js";

/** A rule a adaptive nudge preference must pass. Check returns its problems, or none. */
export interface AdaptiveNudgePreferenceRule {
  check(item: AdaptiveNudgePreference): string[];
}

export class AdaptiveNudgePreferenceCampaignRefLengthRule implements AdaptiveNudgePreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveNudgePreference): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveNudgePreferenceAllowedLabelRule implements AdaptiveNudgePreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveNudgePreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is out of range`];
    return [];
  }
}

export class AdaptiveNudgePreferenceRequiredSourceRule implements AdaptiveNudgePreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveNudgePreference): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveNudgePreferenceCodePrefixRule implements AdaptiveNudgePreferenceRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveNudgePreference): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveNudgePreferenceVisibleGuardRule implements AdaptiveNudgePreferenceRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: AdaptiveNudgePreference): string[] {
    if (item.visible && item.clicks > this.limit) return [`clicks ${item.clicks} exceeds ${this.limit} while visible`];
    return [];
  }
}

/** Runs every rule of a adaptive nudge preference. */
export class AdaptiveNudgePreferenceValidator {
  rules: AdaptiveNudgePreferenceRule[];

  constructor(rules: AdaptiveNudgePreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveNudgePreference): string[] {
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

  requireValid(item: AdaptiveNudgePreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveNudgePreference[]): Map<string, string[]> {
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

export function defaultAdaptiveNudgePreferenceValidator(): AdaptiveNudgePreferenceValidator {
  return new AdaptiveNudgePreferenceValidator(
    [
      new AdaptiveNudgePreferenceCampaignRefLengthRule(80),
      new AdaptiveNudgePreferenceAllowedLabelRule(["manual"]),
      new AdaptiveNudgePreferenceRequiredSourceRule("adaptive nudge preference needs an entry"),
      new AdaptiveNudgePreferenceCodePrefixRule("Q"),
      new AdaptiveNudgePreferenceVisibleGuardRule(120),
    ],
  );
}
