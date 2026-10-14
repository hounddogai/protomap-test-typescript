import * as text from "../../../../kit/text.js";
import { PlacementTemplate } from "./placement-template.js";

/** A rule a placement template must pass. Check returns its problems, or none. */
export interface PlacementTemplateRule {
  check(item: PlacementTemplate): string[];
}

export class PlacementTemplateRequiredReviewerRule implements PlacementTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementTemplate): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementTemplateAttemptsRangeRule implements PlacementTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementTemplate): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PlacementTemplateCodePrefixRule implements PlacementTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PlacementTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PlacementTemplateRateRangeRule implements PlacementTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PlacementTemplate): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PlacementTemplateRequiredTitleRule implements PlacementTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PlacementTemplate): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PlacementTemplateAllowedOwnerIdRule implements PlacementTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PlacementTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is stale`];
    return [];
  }
}

/** Runs every rule of a placement template. */
export class PlacementTemplateValidator {
  rules: PlacementTemplateRule[];

  constructor(rules: PlacementTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: PlacementTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PlacementTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PlacementTemplate[]): Map<string, string[]> {
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

export function defaultPlacementTemplateValidator(): PlacementTemplateValidator {
  return new PlacementTemplateValidator(
    [
      new PlacementTemplateRequiredReviewerRule("placement template needs an entry"),
      new PlacementTemplateAttemptsRangeRule(120, 3600),
      new PlacementTemplateCodePrefixRule("Q"),
      new PlacementTemplateRateRangeRule(0.3, 1436.4),
      new PlacementTemplateRequiredTitleRule("placement template needs an entry"),
      new PlacementTemplateAllowedOwnerIdRule(["fallback"]),
    ],
  );
}
