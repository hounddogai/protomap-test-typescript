import * as text from "../../../../kit/text.js";
import { LegacyMacroPlan } from "./legacy-macro-plan.js";

/** A rule a legacy macro plan must pass. Check returns its problems, or none. */
export interface LegacyMacroPlanRule {
  check(item: LegacyMacroPlan): string[];
}

export class LegacyMacroPlanCodePrefixRule implements LegacyMacroPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyMacroPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyMacroPlanAllowedCodeRule implements LegacyMacroPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyMacroPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class LegacyMacroPlanRequiredCodeRule implements LegacyMacroPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyMacroPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyMacroPlanMaximumRangeRule implements LegacyMacroPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyMacroPlan): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyMacroPlanRequiredCountryRule implements LegacyMacroPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyMacroPlan): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyMacroPlanFloorValueRangeRule implements LegacyMacroPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyMacroPlan): string[] {
    const value = item.floorValue;
    if (value < this.min || value > this.max) return [`floor value ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a legacy macro plan. */
export class LegacyMacroPlanValidator {
  rules: LegacyMacroPlanRule[];

  constructor(rules: LegacyMacroPlanRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyMacroPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyMacroPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyMacroPlan[]): Map<string, string[]> {
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

export function defaultLegacyMacroPlanValidator(): LegacyMacroPlanValidator {
  return new LegacyMacroPlanValidator(
    [
      new LegacyMacroPlanCodePrefixRule("ACM"),
      new LegacyMacroPlanAllowedCodeRule(["adaptive", "capped"]),
      new LegacyMacroPlanRequiredCodeRule("legacy macro plan needs a value"),
      new LegacyMacroPlanMaximumRangeRule(1.5, 1028.9),
      new LegacyMacroPlanRequiredCountryRule("legacy macro plan needs an entry"),
      new LegacyMacroPlanFloorValueRangeRule(6, 644.1),
    ],
  );
}
