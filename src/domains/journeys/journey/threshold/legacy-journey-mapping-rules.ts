import * as text from "../../../../kit/text.js";
import { LegacyJourneyMapping } from "./legacy-journey-mapping.js";

/** A rule a legacy journey mapping must pass. Check returns its problems, or none. */
export interface LegacyJourneyMappingRule {
  check(item: LegacyJourneyMapping): string[];
}

export class LegacyJourneyMappingCodePrefixRule implements LegacyJourneyMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LegacyJourneyMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LegacyJourneyMappingEndsAtRangeRule implements LegacyJourneyMappingRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyJourneyMapping): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyJourneyMappingRequiredLabelRule implements LegacyJourneyMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyJourneyMapping): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyJourneyMappingAllowedCodeRule implements LegacyJourneyMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyJourneyMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

/** Runs every rule of a legacy journey mapping. */
export class LegacyJourneyMappingValidator {
  rules: LegacyJourneyMappingRule[];

  constructor(rules: LegacyJourneyMappingRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyJourneyMapping): string[] {
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

  requireValid(item: LegacyJourneyMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyJourneyMapping[]): Map<string, string[]> {
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

export function defaultLegacyJourneyMappingValidator(): LegacyJourneyMappingValidator {
  return new LegacyJourneyMappingValidator(
    [
      new LegacyJourneyMappingCodePrefixRule("REF"),
      new LegacyJourneyMappingEndsAtRangeRule(1000, 3600),
      new LegacyJourneyMappingRequiredLabelRule("legacy journey mapping needs a value"),
      new LegacyJourneyMappingAllowedCodeRule(["tiered", "fallback", "batched"]),
    ],
  );
}
