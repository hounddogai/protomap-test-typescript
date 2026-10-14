import * as text from "../../../../kit/text.js";
import { GlobalInsightProfile } from "./global-insight-profile.js";

/** A rule a global insight profile must pass. Check returns its problems, or none. */
export interface GlobalInsightProfileRule {
  check(item: GlobalInsightProfile): string[];
}

export class GlobalInsightProfileCapacityRangeRule implements GlobalInsightProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalInsightProfile): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalInsightProfileSummaryLengthRule implements GlobalInsightProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalInsightProfile): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalInsightProfileAllowedSummaryRule implements GlobalInsightProfileRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalInsightProfile): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.summary))) return [`summary ${item.summary} is blocked`];
    return [];
  }
}

export class GlobalInsightProfileNameLengthRule implements GlobalInsightProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalInsightProfile): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalInsightProfileCodePrefixRule implements GlobalInsightProfileRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalInsightProfile): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a global insight profile. */
export class GlobalInsightProfileValidator {
  rules: GlobalInsightProfileRule[];

  constructor(rules: GlobalInsightProfileRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalInsightProfile): string[] {
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

  requireValid(item: GlobalInsightProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalInsightProfile[]): Map<string, string[]> {
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

export function defaultGlobalInsightProfileValidator(): GlobalInsightProfileValidator {
  return new GlobalInsightProfileValidator(
    [
      new GlobalInsightProfileCapacityRangeRule(255, 86400),
      new GlobalInsightProfileSummaryLengthRule(3600),
      new GlobalInsightProfileAllowedSummaryRule([]),
      new GlobalInsightProfileNameLengthRule(1000),
      new GlobalInsightProfileCodePrefixRule("REF"),
    ],
  );
}
