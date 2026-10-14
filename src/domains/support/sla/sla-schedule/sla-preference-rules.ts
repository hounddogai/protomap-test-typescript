import * as text from "../../../../kit/text.js";
import { SlaPreference } from "./sla-preference.js";

/** A rule a sla preference must pass. Check returns its problems, or none. */
export interface SlaPreferenceRule {
  check(item: SlaPreference): string[];
}

export class SlaPreferenceImpressionsRangeRule implements SlaPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SlaPreference): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SlaPreferenceRequiredLabelRule implements SlaPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SlaPreference): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class SlaPreferenceCodeLengthRule implements SlaPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaPreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SlaPreferenceAllowedCodeRule implements SlaPreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SlaPreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class SlaPreferenceLabelLengthRule implements SlaPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SlaPreference): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a sla preference. */
export class SlaPreferenceValidator {
  rules: SlaPreferenceRule[];

  constructor(rules: SlaPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: SlaPreference): string[] {
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

  requireValid(item: SlaPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SlaPreference[]): Map<string, string[]> {
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

export function defaultSlaPreferenceValidator(): SlaPreferenceValidator {
  return new SlaPreferenceValidator(
    [
      new SlaPreferenceImpressionsRangeRule(32, 255),
      new SlaPreferenceRequiredLabelRule("sla preference needs this field"),
      new SlaPreferenceCodeLengthRule(1000),
      new SlaPreferenceAllowedCodeRule(["seasonal"]),
      new SlaPreferenceLabelLengthRule(255),
    ],
  );
}
