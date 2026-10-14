import { AdaptiveModelTemplate } from "./adaptive-model-template.js";

/** A rule a adaptive model template must pass. Check returns its problems, or none. */
export interface AdaptiveModelTemplateRule {
  check(item: AdaptiveModelTemplate): string[];
}

export class AdaptiveModelTemplateRequiredCodeRule implements AdaptiveModelTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveModelTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveModelTemplateCapacityRangeRule implements AdaptiveModelTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveModelTemplate): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveModelTemplateGraceDaysRangeRule implements AdaptiveModelTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveModelTemplate): string[] {
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

export class AdaptiveModelTemplateRequiredNameRule implements AdaptiveModelTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveModelTemplate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive model template. */
export class AdaptiveModelTemplateValidator {
  rules: AdaptiveModelTemplateRule[];

  constructor(rules: AdaptiveModelTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveModelTemplate): string[] {
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

  requireValid(item: AdaptiveModelTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveModelTemplate[]): Map<string, string[]> {
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

export function defaultAdaptiveModelTemplateValidator(): AdaptiveModelTemplateValidator {
  return new AdaptiveModelTemplateValidator(
    [
      new AdaptiveModelTemplateRequiredCodeRule("adaptive model template needs this field"),
      new AdaptiveModelTemplateCapacityRangeRule(3600, 3600),
      new AdaptiveModelTemplateGraceDaysRangeRule(3600, 86400),
      new AdaptiveModelTemplateRequiredNameRule("adaptive model template needs an entry"),
    ],
  );
}
