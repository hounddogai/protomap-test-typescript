import * as text from "../../../../kit/text.js";
import { AdaptiveMacroProfile } from "./adaptive-macro-profile.js";

/** A rule a adaptive macro profile must pass. Check returns its problems, or none. */
export interface AdaptiveMacroProfileRule {
  check(item: AdaptiveMacroProfile): string[];
}

export class AdaptiveMacroProfileRequiredCodeRule implements AdaptiveMacroProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveMacroProfile): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveMacroProfileAllowedCodeRule implements AdaptiveMacroProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveMacroProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

export class AdaptiveMacroProfileRevisionRangeRule implements AdaptiveMacroProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveMacroProfile): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveMacroProfileCodePrefixRule implements AdaptiveMacroProfileRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveMacroProfile): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveMacroProfileVisibleGuardRule implements AdaptiveMacroProfileRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: AdaptiveMacroProfile): string[] {
    if (item.visible && item.conversionRate > this.limit) return [`conversion rate ${item.conversionRate} exceeds ${this.limit} while visible`];
    return [];
  }
}

/** Runs every rule of a adaptive macro profile. */
export class AdaptiveMacroProfileValidator {
  rules: AdaptiveMacroProfileRule[];

  constructor(rules: AdaptiveMacroProfileRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveMacroProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveMacroProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveMacroProfile[]): Map<string, string[]> {
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

export function defaultAdaptiveMacroProfileValidator(): AdaptiveMacroProfileValidator {
  return new AdaptiveMacroProfileValidator(
    [
      new AdaptiveMacroProfileRequiredCodeRule("adaptive macro profile needs an entry"),
      new AdaptiveMacroProfileAllowedCodeRule(["regional"]),
      new AdaptiveMacroProfileRevisionRangeRule(255, 86400),
      new AdaptiveMacroProfileCodePrefixRule("REF"),
      new AdaptiveMacroProfileVisibleGuardRule(8.6),
    ],
  );
}
