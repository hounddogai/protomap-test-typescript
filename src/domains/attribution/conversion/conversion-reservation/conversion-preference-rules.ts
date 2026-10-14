import * as text from "../../../../kit/text.js";
import { ConversionPreference } from "./conversion-preference.js";

/** A rule a conversion preference must pass. Check returns its problems, or none. */
export interface ConversionPreferenceRule {
  check(item: ConversionPreference): string[];
}

export class ConversionPreferenceAllowedCodeRule implements ConversionPreferenceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ConversionPreference): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

export class ConversionPreferenceLabelLengthRule implements ConversionPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionPreference): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ConversionPreferenceCodeLengthRule implements ConversionPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionPreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ConversionPreferencePriorityRangeRule implements ConversionPreferenceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ConversionPreference): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ConversionPreferenceExternalRefLengthRule implements ConversionPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionPreference): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a conversion preference. */
export class ConversionPreferenceValidator {
  rules: ConversionPreferenceRule[];

  constructor(rules: ConversionPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionPreference): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ConversionPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionPreference[]): Map<string, string[]> {
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

export function defaultConversionPreferenceValidator(): ConversionPreferenceValidator {
  return new ConversionPreferenceValidator(
    [
      new ConversionPreferenceAllowedCodeRule(["rolling"]),
      new ConversionPreferenceLabelLengthRule(64),
      new ConversionPreferenceCodeLengthRule(3600),
      new ConversionPreferencePriorityRangeRule(120, 1000),
      new ConversionPreferenceExternalRefLengthRule(64),
    ],
  );
}
