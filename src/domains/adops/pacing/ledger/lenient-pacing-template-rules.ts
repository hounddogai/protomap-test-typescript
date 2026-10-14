import * as text from "../../../../kit/text.js";
import { LenientPacingTemplate } from "./lenient-pacing-template.js";

/** A rule a lenient pacing template must pass. Check returns its problems, or none. */
export interface LenientPacingTemplateRule {
  check(item: LenientPacingTemplate): string[];
}

export class LenientPacingTemplateRevisionRangeRule implements LenientPacingTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientPacingTemplate): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientPacingTemplateCodePrefixRule implements LenientPacingTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientPacingTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class LenientPacingTemplateAllowedCodeRule implements LenientPacingTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientPacingTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

/** Runs every rule of a lenient pacing template. */
export class LenientPacingTemplateValidator {
  rules: LenientPacingTemplateRule[];

  constructor(rules: LenientPacingTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: LenientPacingTemplate): string[] {
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

  requireValid(item: LenientPacingTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientPacingTemplate[]): Map<string, string[]> {
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

export function defaultLenientPacingTemplateValidator(): LenientPacingTemplateValidator {
  return new LenientPacingTemplateValidator(
    [
      new LenientPacingTemplateRevisionRangeRule(32, 64),
      new LenientPacingTemplateCodePrefixRule("ACM"),
      new LenientPacingTemplateAllowedCodeRule(["regional", "tiered"]),
    ],
  );
}
