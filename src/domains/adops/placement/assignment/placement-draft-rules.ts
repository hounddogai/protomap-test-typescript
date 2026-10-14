import { PlacementDraft } from "./placement-draft.js";

/** A rule a placement draft must pass. Check returns its problems, or none. */
export interface PlacementDraftRule {
  check(item: PlacementDraft): string[];
}

export class PlacementDraftRequiredCurrencyRule implements PlacementDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementDraft): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementDraftGraceDaysRangeRule implements PlacementDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementDraft): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PlacementDraftCodeLengthRule implements PlacementDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PlacementDraft): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PlacementDraftRequiredNameRule implements PlacementDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementDraft): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementDraftRequiredCodeRule implements PlacementDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementDraftCodePrefixRule implements PlacementDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PlacementDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a placement draft. */
export class PlacementDraftValidator {
  rules: PlacementDraftRule[];

  constructor(rules: PlacementDraftRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementDraft): string[] {
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

  requireValid(item: PlacementDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementDraft[]): Map<string, string[]> {
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

export function defaultPlacementDraftValidator(): PlacementDraftValidator {
  return new PlacementDraftValidator(
    [
      new PlacementDraftRequiredCurrencyRule("placement draft needs this field"),
      new PlacementDraftGraceDaysRangeRule(80, 120),
      new PlacementDraftCodeLengthRule(1000),
      new PlacementDraftRequiredNameRule("placement draft needs an entry"),
      new PlacementDraftRequiredCodeRule("placement draft needs an entry"),
      new PlacementDraftCodePrefixRule("X"),
    ],
  );
}
