import * as text from "../../../../kit/text.js";
import { SeasonalSlaOverride } from "./seasonal-sla-override.js";

/** A rule a seasonal sla override must pass. Check returns its problems, or none. */
export interface SeasonalSlaOverrideRule {
  check(item: SeasonalSlaOverride): string[];
}

export class SeasonalSlaOverrideAllowedSummaryRule implements SeasonalSlaOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalSlaOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.summary))) return [`summary ${item.summary} is above maximum`];
    return [];
  }
}

export class SeasonalSlaOverrideCodePrefixRule implements SeasonalSlaOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalSlaOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SeasonalSlaOverrideOwnerIdLengthRule implements SeasonalSlaOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalSlaOverride): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalSlaOverrideSummaryLengthRule implements SeasonalSlaOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalSlaOverride): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a seasonal sla override. */
export class SeasonalSlaOverrideValidator {
  rules: SeasonalSlaOverrideRule[];

  constructor(rules: SeasonalSlaOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalSlaOverride): string[] {
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

  requireValid(item: SeasonalSlaOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalSlaOverride[]): Map<string, string[]> {
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

export function defaultSeasonalSlaOverrideValidator(): SeasonalSlaOverrideValidator {
  return new SeasonalSlaOverrideValidator(
    [
      new SeasonalSlaOverrideAllowedSummaryRule(["regional", "manual"]),
      new SeasonalSlaOverrideCodePrefixRule("REF"),
      new SeasonalSlaOverrideOwnerIdLengthRule(3600),
      new SeasonalSlaOverrideSummaryLengthRule(86400),
    ],
  );
}
