import * as text from "../../../../kit/text.js";
import { CreativeTemplate } from "./creative-template.js";

/** A rule a creative template must pass. Check returns its problems, or none. */
export interface CreativeTemplateRule {
  check(item: CreativeTemplate): string[];
}

export class CreativeTemplateThresholdRangeRule implements CreativeTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeTemplate): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreativeTemplateRetriesRangeRule implements CreativeTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeTemplate): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreativeTemplateGraceDaysRangeRule implements CreativeTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeTemplate): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CreativeTemplateAllowedExternalRefRule implements CreativeTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreativeTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is out of range`];
    return [];
  }
}

/** Runs every rule of a creative template. */
export class CreativeTemplateValidator {
  rules: CreativeTemplateRule[];

  constructor(rules: CreativeTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreativeTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeTemplate[]): Map<string, string[]> {
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

export function defaultCreativeTemplateValidator(): CreativeTemplateValidator {
  return new CreativeTemplateValidator(
    [
      new CreativeTemplateThresholdRangeRule(8.5, 85.4),
      new CreativeTemplateRetriesRangeRule(16, 64),
      new CreativeTemplateGraceDaysRangeRule(64, 1000),
      new CreativeTemplateAllowedExternalRefRule(["scheduled", "scheduled"]),
    ],
  );
}
