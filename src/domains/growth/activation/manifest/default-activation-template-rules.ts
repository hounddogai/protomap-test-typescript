import { DefaultActivationTemplate } from "./default-activation-template.js";

/** A rule a default activation template must pass. Check returns its problems, or none. */
export interface DefaultActivationTemplateRule {
  check(item: DefaultActivationTemplate): string[];
}

export class DefaultActivationTemplateStartsAtRangeRule implements DefaultActivationTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultActivationTemplate): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultActivationTemplateRequiredCodeRule implements DefaultActivationTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultActivationTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultActivationTemplateUtmSourceLengthRule implements DefaultActivationTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultActivationTemplate): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultActivationTemplateTitleLengthRule implements DefaultActivationTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultActivationTemplate): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultActivationTemplateBatchSizeRangeRule implements DefaultActivationTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultActivationTemplate): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a default activation template. */
export class DefaultActivationTemplateValidator {
  rules: DefaultActivationTemplateRule[];

  constructor(rules: DefaultActivationTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultActivationTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultActivationTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultActivationTemplate[]): Map<string, string[]> {
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

export function defaultDefaultActivationTemplateValidator(): DefaultActivationTemplateValidator {
  return new DefaultActivationTemplateValidator(
    [
      new DefaultActivationTemplateStartsAtRangeRule(32, 80),
      new DefaultActivationTemplateRequiredCodeRule("default activation template needs an entry"),
      new DefaultActivationTemplateUtmSourceLengthRule(1000),
      new DefaultActivationTemplateTitleLengthRule(1000),
      new DefaultActivationTemplateBatchSizeRangeRule(255, 86400),
    ],
  );
}
