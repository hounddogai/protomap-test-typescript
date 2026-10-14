import { ManualPreferenceTemplate } from "./manual-preference-template.js";

/** A rule a manual preference template must pass. Check returns its problems, or none. */
export interface ManualPreferenceTemplateRule {
  check(item: ManualPreferenceTemplate): string[];
}

export class ManualPreferenceTemplateClicksRangeRule implements ManualPreferenceTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualPreferenceTemplate): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualPreferenceTemplateCodePrefixRule implements ManualPreferenceTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualPreferenceTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualPreferenceTemplateRequiredTitleRule implements ManualPreferenceTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPreferenceTemplate): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual preference template. */
export class ManualPreferenceTemplateValidator {
  rules: ManualPreferenceTemplateRule[];

  constructor(rules: ManualPreferenceTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: ManualPreferenceTemplate): string[] {
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

  requireValid(item: ManualPreferenceTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualPreferenceTemplate[]): Map<string, string[]> {
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

export function defaultManualPreferenceTemplateValidator(): ManualPreferenceTemplateValidator {
  return new ManualPreferenceTemplateValidator(
    [
      new ManualPreferenceTemplateClicksRangeRule(255, 1000),
      new ManualPreferenceTemplateCodePrefixRule("ACM"),
      new ManualPreferenceTemplateRequiredTitleRule("manual preference template needs this field"),
    ],
  );
}
