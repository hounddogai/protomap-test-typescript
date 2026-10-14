import { StrictExitRuleDraft } from "./strict-exit-rule-draft.js";

/** A rule a strict exit rule draft must pass. Check returns its problems, or none. */
export interface StrictExitRuleDraftRule {
  check(item: StrictExitRuleDraft): string[];
}

export class StrictExitRuleDraftVersionRangeRule implements StrictExitRuleDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictExitRuleDraft): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictExitRuleDraftRequiredLabelRule implements StrictExitRuleDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictExitRuleDraft): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class StrictExitRuleDraftRequiredTitleRule implements StrictExitRuleDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictExitRuleDraft): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StrictExitRuleDraftActiveGuardRule implements StrictExitRuleDraftRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: StrictExitRuleDraft): string[] {
    if (item.active && item.impressions > this.limit) return [`impressions ${item.impressions} exceeds ${this.limit} while active`];
    return [];
  }
}

export class StrictExitRuleDraftCodeLengthRule implements StrictExitRuleDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictExitRuleDraft): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictExitRuleDraftRateRangeRule implements StrictExitRuleDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictExitRuleDraft): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a strict exit rule draft. */
export class StrictExitRuleDraftValidator {
  rules: StrictExitRuleDraftRule[];

  constructor(rules: StrictExitRuleDraftRule[]) {
    this.rules = rules;
  }

  validate(item: StrictExitRuleDraft): string[] {
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

  requireValid(item: StrictExitRuleDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictExitRuleDraft[]): Map<string, string[]> {
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

export function defaultStrictExitRuleDraftValidator(): StrictExitRuleDraftValidator {
  return new StrictExitRuleDraftValidator(
    [
      new StrictExitRuleDraftVersionRangeRule(64, 255),
      new StrictExitRuleDraftRequiredLabelRule("strict exit rule draft needs a value"),
      new StrictExitRuleDraftRequiredTitleRule("strict exit rule draft needs an entry"),
      new StrictExitRuleDraftActiveGuardRule(64),
      new StrictExitRuleDraftCodeLengthRule(64),
      new StrictExitRuleDraftRateRangeRule(6.3, 4280),
    ],
  );
}
