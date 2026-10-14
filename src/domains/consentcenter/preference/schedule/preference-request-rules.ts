import { PreferenceRequest } from "./preference-request.js";

/** A rule a preference request must pass. Check returns its problems, or none. */
export interface PreferenceRequestRule {
  check(item: PreferenceRequest): string[];
}

export class PreferenceRequestThresholdRangeRule implements PreferenceRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceRequest): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PreferenceRequestRequiredNameRule implements PreferenceRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceRequest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceRequestMinimumRangeRule implements PreferenceRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceRequest): string[] {
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

export class PreferenceRequestRequiredLocaleRule implements PreferenceRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceRequest): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceRequestRequiredAudienceIdRule implements PreferenceRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceRequest): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class PreferenceRequestRequiredCodeRule implements PreferenceRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a preference request. */
export class PreferenceRequestValidator {
  rules: PreferenceRequestRule[];

  constructor(rules: PreferenceRequestRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PreferenceRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceRequest[]): Map<string, string[]> {
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

export function defaultPreferenceRequestValidator(): PreferenceRequestValidator {
  return new PreferenceRequestValidator(
    [
      new PreferenceRequestThresholdRangeRule(9.6, 599.5),
      new PreferenceRequestRequiredNameRule("preference request needs a value"),
      new PreferenceRequestMinimumRangeRule(5.5, 2495.4),
      new PreferenceRequestRequiredLocaleRule("preference request needs an entry"),
      new PreferenceRequestRequiredAudienceIdRule("preference request needs this field"),
      new PreferenceRequestRequiredCodeRule("preference request needs a value"),
    ],
  );
}
