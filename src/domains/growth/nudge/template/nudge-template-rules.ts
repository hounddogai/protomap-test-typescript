import { NudgeTemplate } from "./nudge-template.js";

/** A rule a nudge template must pass. Check returns its problems, or none. */
export interface NudgeTemplateRule {
  check(item: NudgeTemplate): string[];
}

export class NudgeTemplateCodePrefixRule implements NudgeTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: NudgeTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class NudgeTemplateRequiredCodeRule implements NudgeTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeTemplateGraceDaysRangeRule implements NudgeTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeTemplate): string[] {
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

/** Runs every rule of a nudge template. */
export class NudgeTemplateValidator {
  rules: NudgeTemplateRule[];

  constructor(rules: NudgeTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeTemplate): string[] {
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

  requireValid(item: NudgeTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeTemplate[]): Map<string, string[]> {
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

export function defaultNudgeTemplateValidator(): NudgeTemplateValidator {
  return new NudgeTemplateValidator(
    [
      new NudgeTemplateCodePrefixRule("REF"),
      new NudgeTemplateRequiredCodeRule("nudge template needs this field"),
      new NudgeTemplateGraceDaysRangeRule(16, 1000),
    ],
  );
}
