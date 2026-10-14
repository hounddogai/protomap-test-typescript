import * as text from "../../../../kit/text.js";
import { SeasonalMacroRequest } from "./seasonal-macro-request.js";

/** A rule a seasonal macro request must pass. Check returns its problems, or none. */
export interface SeasonalMacroRequestRule {
  check(item: SeasonalMacroRequest): string[];
}

export class SeasonalMacroRequestAllowedNameRule implements SeasonalMacroRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalMacroRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is below minimum`];
    return [];
  }
}

export class SeasonalMacroRequestRequiredCurrencyRule implements SeasonalMacroRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalMacroRequest): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalMacroRequestRequiredCodeRule implements SeasonalMacroRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalMacroRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalMacroRequestRequiredNameRule implements SeasonalMacroRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalMacroRequest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalMacroRequestVariantLengthRule implements SeasonalMacroRequestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalMacroRequest): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalMacroRequestRequiredVariantRule implements SeasonalMacroRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalMacroRequest): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal macro request. */
export class SeasonalMacroRequestValidator {
  rules: SeasonalMacroRequestRule[];

  constructor(rules: SeasonalMacroRequestRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalMacroRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalMacroRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalMacroRequest[]): Map<string, string[]> {
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

export function defaultSeasonalMacroRequestValidator(): SeasonalMacroRequestValidator {
  return new SeasonalMacroRequestValidator(
    [
      new SeasonalMacroRequestAllowedNameRule([]),
      new SeasonalMacroRequestRequiredCurrencyRule("seasonal macro request needs a value"),
      new SeasonalMacroRequestRequiredCodeRule("seasonal macro request needs a value"),
      new SeasonalMacroRequestRequiredNameRule("seasonal macro request needs a value"),
      new SeasonalMacroRequestVariantLengthRule(120),
      new SeasonalMacroRequestRequiredVariantRule("seasonal macro request needs a value"),
    ],
  );
}
