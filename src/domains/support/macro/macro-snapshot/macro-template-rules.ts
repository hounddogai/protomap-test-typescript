import * as text from "../../../../kit/text.js";
import { MacroTemplate } from "./macro-template.js";

/** A rule a macro template must pass. Check returns its problems, or none. */
export interface MacroTemplateRule {
  check(item: MacroTemplate): string[];
}

export class MacroTemplateAllowedAudienceIdRule implements MacroTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: MacroTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.audienceId))) return [`audience id ${item.audienceId} is duplicated`];
    return [];
  }
}

export class MacroTemplateCodePrefixRule implements MacroTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: MacroTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class MacroTemplateStartsAtRangeRule implements MacroTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: MacroTemplate): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class MacroTemplateJourneyIdLengthRule implements MacroTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroTemplate): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a macro template. */
export class MacroTemplateValidator {
  rules: MacroTemplateRule[];

  constructor(rules: MacroTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: MacroTemplate): string[] {
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

  requireValid(item: MacroTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroTemplate[]): Map<string, string[]> {
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

export function defaultMacroTemplateValidator(): MacroTemplateValidator {
  return new MacroTemplateValidator(
    [
      new MacroTemplateAllowedAudienceIdRule(["global", "regional", "tiered"]),
      new MacroTemplateCodePrefixRule("REF"),
      new MacroTemplateStartsAtRangeRule(120, 3600),
      new MacroTemplateJourneyIdLengthRule(3600),
    ],
  );
}
