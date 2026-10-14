import { StepTemplate } from "./step-template.js";

/** A rule a step template must pass. Check returns its problems, or none. */
export interface StepTemplateRule {
  check(item: StepTemplate): string[];
}

export class StepTemplateQuantityRangeRule implements StepTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepTemplate): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StepTemplateRequiredNameRule implements StepTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepTemplate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class StepTemplateAudienceIdLengthRule implements StepTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StepTemplate): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StepTemplateRequiredCodeRule implements StepTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StepTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a step template. */
export class StepTemplateValidator {
  rules: StepTemplateRule[];

  constructor(rules: StepTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: StepTemplate): string[] {
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

  requireValid(item: StepTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepTemplate[]): Map<string, string[]> {
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

export function defaultStepTemplateValidator(): StepTemplateValidator {
  return new StepTemplateValidator(
    [
      new StepTemplateQuantityRangeRule(80, 80),
      new StepTemplateRequiredNameRule("step template needs a value"),
      new StepTemplateAudienceIdLengthRule(32),
      new StepTemplateRequiredCodeRule("step template needs an entry"),
    ],
  );
}
