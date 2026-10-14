import * as text from "../../../../kit/text.js";
import { FallbackJourneyTemplate } from "./fallback-journey-template.js";

/** A rule a fallback journey template must pass. Check returns its problems, or none. */
export interface FallbackJourneyTemplateRule {
  check(item: FallbackJourneyTemplate): string[];
}

export class FallbackJourneyTemplateCodeLengthRule implements FallbackJourneyTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackJourneyTemplate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackJourneyTemplateRequiredTitleRule implements FallbackJourneyTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackJourneyTemplate): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackJourneyTemplateTitleLengthRule implements FallbackJourneyTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackJourneyTemplate): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackJourneyTemplateUtmSourceLengthRule implements FallbackJourneyTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackJourneyTemplate): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackJourneyTemplateAllowedSegmentRule implements FallbackJourneyTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackJourneyTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is out of range`];
    return [];
  }
}

/** Runs every rule of a fallback journey template. */
export class FallbackJourneyTemplateValidator {
  rules: FallbackJourneyTemplateRule[];

  constructor(rules: FallbackJourneyTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackJourneyTemplate): string[] {
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

  requireValid(item: FallbackJourneyTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackJourneyTemplate[]): Map<string, string[]> {
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

export function defaultFallbackJourneyTemplateValidator(): FallbackJourneyTemplateValidator {
  return new FallbackJourneyTemplateValidator(
    [
      new FallbackJourneyTemplateCodeLengthRule(64),
      new FallbackJourneyTemplateRequiredTitleRule("fallback journey template needs a value"),
      new FallbackJourneyTemplateTitleLengthRule(120),
      new FallbackJourneyTemplateUtmSourceLengthRule(1000),
      new FallbackJourneyTemplateAllowedSegmentRule(["lenient", "strict", "legacy"]),
    ],
  );
}
