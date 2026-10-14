import * as text from "../../../../kit/text.js";
import { WeightedPreferenceRequest } from "./weighted-preference-request.js";

/** A rule a weighted preference request must pass. Check returns its problems, or none. */
export interface WeightedPreferenceRequestRule {
  check(item: WeightedPreferenceRequest): string[];
}

export class WeightedPreferenceRequestRequiredCodeRule implements WeightedPreferenceRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPreferenceRequest): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedPreferenceRequestRequiredVariantRule implements WeightedPreferenceRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPreferenceRequest): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedPreferenceRequestExpiresAtRangeRule implements WeightedPreferenceRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedPreferenceRequest): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WeightedPreferenceRequestAllowedCodeRule implements WeightedPreferenceRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedPreferenceRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

export class WeightedPreferenceRequestRequiredNameRule implements WeightedPreferenceRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedPreferenceRequest): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted preference request. */
export class WeightedPreferenceRequestValidator {
  rules: WeightedPreferenceRequestRule[];

  constructor(rules: WeightedPreferenceRequestRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedPreferenceRequest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedPreferenceRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedPreferenceRequest[]): Map<string, string[]> {
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

export function defaultWeightedPreferenceRequestValidator(): WeightedPreferenceRequestValidator {
  return new WeightedPreferenceRequestValidator(
    [
      new WeightedPreferenceRequestRequiredCodeRule("weighted preference request needs an entry"),
      new WeightedPreferenceRequestRequiredVariantRule("weighted preference request needs this field"),
      new WeightedPreferenceRequestExpiresAtRangeRule(120, 86400),
      new WeightedPreferenceRequestAllowedCodeRule(["regional"]),
      new WeightedPreferenceRequestRequiredNameRule("weighted preference request needs a value"),
    ],
  );
}
