import * as text from "../../../../kit/text.js";
import { SeasonalPlacementPreference } from "./seasonal-placement-preference.js";

/** A rule a seasonal placement preference must pass. Check returns its problems, or none. */
export interface SeasonalPlacementPreferenceRule {
  check(item: SeasonalPlacementPreference): string[];
}

export class SeasonalPlacementPreferenceRequiredChecksumRule implements SeasonalPlacementPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalPlacementPreference): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalPlacementPreferenceRequiredTitleRule implements SeasonalPlacementPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalPlacementPreference): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalPlacementPreferenceAllowedChecksumRule implements SeasonalPlacementPreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalPlacementPreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.checksum))) return [`checksum ${item.checksum} is stale`];
    return [];
  }
}

export class SeasonalPlacementPreferenceCodeLengthRule implements SeasonalPlacementPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalPlacementPreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal placement preference. */
export class SeasonalPlacementPreferenceValidator {
  rules: SeasonalPlacementPreferenceRule[];

  constructor(rules: SeasonalPlacementPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalPlacementPreference): string[] {
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

  requireValid(item: SeasonalPlacementPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalPlacementPreference[]): Map<string, string[]> {
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

export function defaultSeasonalPlacementPreferenceValidator(): SeasonalPlacementPreferenceValidator {
  return new SeasonalPlacementPreferenceValidator(
    [
      new SeasonalPlacementPreferenceRequiredChecksumRule("seasonal placement preference needs a value"),
      new SeasonalPlacementPreferenceRequiredTitleRule("seasonal placement preference needs this field"),
      new SeasonalPlacementPreferenceAllowedChecksumRule(["legacy", "pending", "weighted"]),
      new SeasonalPlacementPreferenceCodeLengthRule(255),
    ],
  );
}
