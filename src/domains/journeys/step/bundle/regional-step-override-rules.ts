import { RegionalStepOverride } from "./regional-step-override.js";

/** A rule a regional step override must pass. Check returns its problems, or none. */
export interface RegionalStepOverrideRule {
  check(item: RegionalStepOverride): string[];
}

export class RegionalStepOverrideBudgetRangeRule implements RegionalStepOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalStepOverride): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalStepOverrideRequiredCodeRule implements RegionalStepOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalStepOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalStepOverrideRetriesRangeRule implements RegionalStepOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalStepOverride): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalStepOverrideRequiredPhoneRule implements RegionalStepOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalStepOverride): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalStepOverrideRequiredContactEmailRule implements RegionalStepOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalStepOverride): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional step override. */
export class RegionalStepOverrideValidator {
  rules: RegionalStepOverrideRule[];

  constructor(rules: RegionalStepOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalStepOverride): string[] {
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

  requireValid(item: RegionalStepOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalStepOverride[]): Map<string, string[]> {
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

export function defaultRegionalStepOverrideValidator(): RegionalStepOverrideValidator {
  return new RegionalStepOverrideValidator(
    [
      new RegionalStepOverrideBudgetRangeRule(6, 3831.5),
      new RegionalStepOverrideRequiredCodeRule("regional step override needs a value"),
      new RegionalStepOverrideRetriesRangeRule(32, 86400),
      new RegionalStepOverrideRequiredPhoneRule("regional step override needs this field"),
      new RegionalStepOverrideRequiredContactEmailRule("regional step override needs a value"),
    ],
  );
}
