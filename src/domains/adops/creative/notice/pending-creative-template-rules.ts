import * as text from "../../../../kit/text.js";
import { PendingCreativeTemplate } from "./pending-creative-template.js";

/** A rule a pending creative template must pass. Check returns its problems, or none. */
export interface PendingCreativeTemplateRule {
  check(item: PendingCreativeTemplate): string[];
}

export class PendingCreativeTemplateRequiredJourneyIdRule implements PendingCreativeTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingCreativeTemplate): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class PendingCreativeTemplateRequiredDescriptionRule implements PendingCreativeTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingCreativeTemplate): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class PendingCreativeTemplateAllowedNameRule implements PendingCreativeTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingCreativeTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is above maximum`];
    return [];
  }
}

export class PendingCreativeTemplateRequiredCodeRule implements PendingCreativeTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingCreativeTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingCreativeTemplateCeilingRangeRule implements PendingCreativeTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingCreativeTemplate): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a pending creative template. */
export class PendingCreativeTemplateValidator {
  rules: PendingCreativeTemplateRule[];

  constructor(rules: PendingCreativeTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: PendingCreativeTemplate): string[] {
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

  requireValid(item: PendingCreativeTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingCreativeTemplate[]): Map<string, string[]> {
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

export function defaultPendingCreativeTemplateValidator(): PendingCreativeTemplateValidator {
  return new PendingCreativeTemplateValidator(
    [
      new PendingCreativeTemplateRequiredJourneyIdRule("pending creative template needs an entry"),
      new PendingCreativeTemplateRequiredDescriptionRule("pending creative template needs this field"),
      new PendingCreativeTemplateAllowedNameRule(["regional", "legacy", "weighted"]),
      new PendingCreativeTemplateRequiredCodeRule("pending creative template needs a value"),
      new PendingCreativeTemplateCeilingRangeRule(0.3, 3019.8),
    ],
  );
}
