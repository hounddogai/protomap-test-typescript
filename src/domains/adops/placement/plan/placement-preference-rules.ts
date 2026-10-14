import * as text from "../../../../kit/text.js";
import { PlacementPreference } from "./placement-preference.js";

/** A rule a placement preference must pass. Check returns its problems, or none. */
export interface PlacementPreferenceRule {
  check(item: PlacementPreference): string[];
}

export class PlacementPreferenceUtmSourceLengthRule implements PlacementPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementPreference): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementPreferenceAllowedCodeRule implements PlacementPreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PlacementPreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class PlacementPreferenceOpenRateRangeRule implements PlacementPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementPreference): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PlacementPreferenceRequiredUtmSourceRule implements PlacementPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementPreference): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementPreferenceMinimumRangeRule implements PlacementPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementPreference): string[] {
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

/** Runs every rule of a placement preference. */
export class PlacementPreferenceValidator {
  rules: PlacementPreferenceRule[];

  constructor(rules: PlacementPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementPreference): string[] {
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

  requireValid(item: PlacementPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementPreference[]): Map<string, string[]> {
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

export function defaultPlacementPreferenceValidator(): PlacementPreferenceValidator {
  return new PlacementPreferenceValidator(
    [
      new PlacementPreferenceUtmSourceLengthRule(3600),
      new PlacementPreferenceAllowedCodeRule(["regional", "strict"]),
      new PlacementPreferenceOpenRateRangeRule(6, 1788.5),
      new PlacementPreferenceRequiredUtmSourceRule("placement preference needs a value"),
      new PlacementPreferenceMinimumRangeRule(4.9, 4733.8),
    ],
  );
}
