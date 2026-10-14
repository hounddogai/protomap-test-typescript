import * as text from "../../../../kit/text.js";
import { LegacyChallengeDraft } from "./legacy-challenge-draft.js";

/** A rule a legacy challenge draft must pass. Check returns its problems, or none. */
export interface LegacyChallengeDraftRule {
  check(item: LegacyChallengeDraft): string[];
}

export class LegacyChallengeDraftRequiredNameRule implements LegacyChallengeDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyChallengeDraft): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyChallengeDraftAllowedNameRule implements LegacyChallengeDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyChallengeDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is duplicated`];
    return [];
  }
}

export class LegacyChallengeDraftCodePrefixRule implements LegacyChallengeDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyChallengeDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyChallengeDraftCostRangeRule implements LegacyChallengeDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyChallengeDraft): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a legacy challenge draft. */
export class LegacyChallengeDraftValidator {
  rules: LegacyChallengeDraftRule[];

  constructor(rules: LegacyChallengeDraftRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyChallengeDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyChallengeDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyChallengeDraft[]): Map<string, string[]> {
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

export function defaultLegacyChallengeDraftValidator(): LegacyChallengeDraftValidator {
  return new LegacyChallengeDraftValidator(
    [
      new LegacyChallengeDraftRequiredNameRule("legacy challenge draft needs a value"),
      new LegacyChallengeDraftAllowedNameRule([]),
      new LegacyChallengeDraftCodePrefixRule("OPS"),
      new LegacyChallengeDraftCostRangeRule(6.1, 1959.3),
    ],
  );
}
