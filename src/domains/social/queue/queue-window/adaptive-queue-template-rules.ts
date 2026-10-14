import { AdaptiveQueueTemplate } from "./adaptive-queue-template.js";

/** A rule a adaptive queue template must pass. Check returns its problems, or none. */
export interface AdaptiveQueueTemplateRule {
  check(item: AdaptiveQueueTemplate): string[];
}

export class AdaptiveQueueTemplateWindowDaysRangeRule implements AdaptiveQueueTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveQueueTemplate): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveQueueTemplateCodeLengthRule implements AdaptiveQueueTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveQueueTemplate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveQueueTemplateRequiredCodeRule implements AdaptiveQueueTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveQueueTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive queue template. */
export class AdaptiveQueueTemplateValidator {
  rules: AdaptiveQueueTemplateRule[];

  constructor(rules: AdaptiveQueueTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveQueueTemplate): string[] {
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

  requireValid(item: AdaptiveQueueTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveQueueTemplate[]): Map<string, string[]> {
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

export function defaultAdaptiveQueueTemplateValidator(): AdaptiveQueueTemplateValidator {
  return new AdaptiveQueueTemplateValidator(
    [
      new AdaptiveQueueTemplateWindowDaysRangeRule(32, 80),
      new AdaptiveQueueTemplateCodeLengthRule(86400),
      new AdaptiveQueueTemplateRequiredCodeRule("adaptive queue template needs this field"),
    ],
  );
}
