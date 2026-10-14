import { PreferenceThreshold } from "./preference-threshold.js";

/** A rule a preference threshold must pass. Check returns its problems, or none. */
export interface PreferenceThresholdRule {
  check(item: PreferenceThreshold): string[];
}

export class PreferenceThresholdRequiredLabelRule implements PreferenceThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceThreshold): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceThresholdVersionRangeRule implements PreferenceThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceThreshold): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PreferenceThresholdRequiredCodeRule implements PreferenceThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a preference threshold. */
export class PreferenceThresholdValidator {
  rules: PreferenceThresholdRule[];

  constructor(rules: PreferenceThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceThreshold): string[] {
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

  requireValid(item: PreferenceThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceThreshold[]): Map<string, string[]> {
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

export function defaultPreferenceThresholdValidator(): PreferenceThresholdValidator {
  return new PreferenceThresholdValidator(
    [
      new PreferenceThresholdRequiredLabelRule("preference threshold needs a value"),
      new PreferenceThresholdVersionRangeRule(64, 86400),
      new PreferenceThresholdRequiredCodeRule("preference threshold needs a value"),
    ],
  );
}
