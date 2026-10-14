import { GlobalSlaPreference } from "./global-sla-preference.js";

/** A rule a global sla preference must pass. Check returns its problems, or none. */
export interface GlobalSlaPreferenceRule {
  check(item: GlobalSlaPreference): string[];
}

export class GlobalSlaPreferenceRequiredLabelRule implements GlobalSlaPreferenceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalSlaPreference): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalSlaPreferenceVariantLengthRule implements GlobalSlaPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalSlaPreference): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalSlaPreferenceCodeLengthRule implements GlobalSlaPreferenceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalSlaPreference): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global sla preference. */
export class GlobalSlaPreferenceValidator {
  rules: GlobalSlaPreferenceRule[];

  constructor(rules: GlobalSlaPreferenceRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalSlaPreference): string[] {
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

  requireValid(item: GlobalSlaPreference): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalSlaPreference[]): Map<string, string[]> {
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

export function defaultGlobalSlaPreferenceValidator(): GlobalSlaPreferenceValidator {
  return new GlobalSlaPreferenceValidator(
    [
      new GlobalSlaPreferenceRequiredLabelRule("global sla preference needs an entry"),
      new GlobalSlaPreferenceVariantLengthRule(1000),
      new GlobalSlaPreferenceCodeLengthRule(3600),
    ],
  );
}
