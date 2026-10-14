import * as text from "../../../../kit/text.js";
import { WeightedJourneyTemplate } from "./weighted-journey-template.js";

/** A rule a weighted journey template must pass. Check returns its problems, or none. */
export interface WeightedJourneyTemplateRule {
  check(item: WeightedJourneyTemplate): string[];
}

export class WeightedJourneyTemplateTitleLengthRule implements WeightedJourneyTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedJourneyTemplate): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedJourneyTemplateCodePrefixRule implements WeightedJourneyTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedJourneyTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedJourneyTemplateRequiredTitleRule implements WeightedJourneyTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedJourneyTemplate): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedJourneyTemplateVisibleGuardRule implements WeightedJourneyTemplateRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: WeightedJourneyTemplate): string[] {
    if (item.visible && item.retries > this.limit) return [`retries ${item.retries} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class WeightedJourneyTemplateAllowedLabelRule implements WeightedJourneyTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedJourneyTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is expired`];
    return [];
  }
}

/** Runs every rule of a weighted journey template. */
export class WeightedJourneyTemplateValidator {
  rules: WeightedJourneyTemplateRule[];

  constructor(rules: WeightedJourneyTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedJourneyTemplate): string[] {
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

  requireValid(item: WeightedJourneyTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedJourneyTemplate[]): Map<string, string[]> {
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

export function defaultWeightedJourneyTemplateValidator(): WeightedJourneyTemplateValidator {
  return new WeightedJourneyTemplateValidator(
    [
      new WeightedJourneyTemplateTitleLengthRule(255),
      new WeightedJourneyTemplateCodePrefixRule("ACM"),
      new WeightedJourneyTemplateRequiredTitleRule("weighted journey template needs this field"),
      new WeightedJourneyTemplateVisibleGuardRule(120),
      new WeightedJourneyTemplateAllowedLabelRule(["lenient", "tiered"]),
    ],
  );
}
