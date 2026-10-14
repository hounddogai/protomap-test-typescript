import * as text from "../../../../kit/text.js";
import { GlobalPreferenceBundle } from "./global-preference-bundle.js";

/** A rule a global preference bundle must pass. Check returns its problems, or none. */
export interface GlobalPreferenceBundleRule {
  check(item: GlobalPreferenceBundle): string[];
}

export class GlobalPreferenceBundleLabelLengthRule implements GlobalPreferenceBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalPreferenceBundle): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalPreferenceBundleAllowedAudienceIdRule implements GlobalPreferenceBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalPreferenceBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.audienceId))) return [`audience id ${item.audienceId} is inconsistent`];
    return [];
  }
}

export class GlobalPreferenceBundleChannelLengthRule implements GlobalPreferenceBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalPreferenceBundle): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalPreferenceBundleRequiredChannelRule implements GlobalPreferenceBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalPreferenceBundle): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalPreferenceBundleCodeLengthRule implements GlobalPreferenceBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalPreferenceBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global preference bundle. */
export class GlobalPreferenceBundleValidator {
  rules: GlobalPreferenceBundleRule[];

  constructor(rules: GlobalPreferenceBundleRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalPreferenceBundle): string[] {
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

  requireValid(item: GlobalPreferenceBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalPreferenceBundle[]): Map<string, string[]> {
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

export function defaultGlobalPreferenceBundleValidator(): GlobalPreferenceBundleValidator {
  return new GlobalPreferenceBundleValidator(
    [
      new GlobalPreferenceBundleLabelLengthRule(3600),
      new GlobalPreferenceBundleAllowedAudienceIdRule(["global", "default"]),
      new GlobalPreferenceBundleChannelLengthRule(86400),
      new GlobalPreferenceBundleRequiredChannelRule("global preference bundle needs this field"),
      new GlobalPreferenceBundleCodeLengthRule(120),
    ],
  );
}
