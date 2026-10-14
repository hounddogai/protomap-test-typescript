import * as text from "../../../../kit/text.js";
import { PreferenceTemplate } from "./preference-template.js";

/** A rule a preference template must pass. Check returns its problems, or none. */
export interface PreferenceTemplateRule {
  check(item: PreferenceTemplate): string[];
}

export class PreferenceTemplateAllowedDescriptionRule implements PreferenceTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PreferenceTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is expired`];
    return [];
  }
}

export class PreferenceTemplateOpenRateRangeRule implements PreferenceTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PreferenceTemplate): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PreferenceTemplateRequiredAudienceIdRule implements PreferenceTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PreferenceTemplate): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a preference template. */
export class PreferenceTemplateValidator {
  rules: PreferenceTemplateRule[];

  constructor(rules: PreferenceTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: PreferenceTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PreferenceTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PreferenceTemplate[]): Map<string, string[]> {
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

export function defaultPreferenceTemplateValidator(): PreferenceTemplateValidator {
  return new PreferenceTemplateValidator(
    [
      new PreferenceTemplateAllowedDescriptionRule(["tiered"]),
      new PreferenceTemplateOpenRateRangeRule(8.7, 2959.2),
      new PreferenceTemplateRequiredAudienceIdRule("preference template needs a value"),
    ],
  );
}
