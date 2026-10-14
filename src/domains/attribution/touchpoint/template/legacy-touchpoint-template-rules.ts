import { LegacyTouchpointTemplate } from "./legacy-touchpoint-template.js";

/** A rule a legacy touchpoint template must pass. Check returns its problems, or none. */
export interface LegacyTouchpointTemplateRule {
  check(item: LegacyTouchpointTemplate): string[];
}

export class LegacyTouchpointTemplateCreatedAtRangeRule implements LegacyTouchpointTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyTouchpointTemplate): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyTouchpointTemplateRequiredNameRule implements LegacyTouchpointTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyTouchpointTemplate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyTouchpointTemplateCategoryLengthRule implements LegacyTouchpointTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyTouchpointTemplate): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyTouchpointTemplateVersionRangeRule implements LegacyTouchpointTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyTouchpointTemplate): string[] {
    const value = item.version;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`version ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`version ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a legacy touchpoint template. */
export class LegacyTouchpointTemplateValidator {
  rules: LegacyTouchpointTemplateRule[];

  constructor(rules: LegacyTouchpointTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyTouchpointTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyTouchpointTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyTouchpointTemplate[]): Map<string, string[]> {
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

export function defaultLegacyTouchpointTemplateValidator(): LegacyTouchpointTemplateValidator {
  return new LegacyTouchpointTemplateValidator(
    [
      new LegacyTouchpointTemplateCreatedAtRangeRule(255, 255),
      new LegacyTouchpointTemplateRequiredNameRule("legacy touchpoint template needs an entry"),
      new LegacyTouchpointTemplateCategoryLengthRule(3600),
      new LegacyTouchpointTemplateVersionRangeRule(16, 120),
    ],
  );
}
