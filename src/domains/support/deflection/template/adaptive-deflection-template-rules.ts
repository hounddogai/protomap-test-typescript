import { AdaptiveDeflectionTemplate } from "./adaptive-deflection-template.js";

/** A rule a adaptive deflection template must pass. Check returns its problems, or none. */
export interface AdaptiveDeflectionTemplateRule {
  check(item: AdaptiveDeflectionTemplate): string[];
}

export class AdaptiveDeflectionTemplateRequiredTitleRule implements AdaptiveDeflectionTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveDeflectionTemplate): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveDeflectionTemplateTitleLengthRule implements AdaptiveDeflectionTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveDeflectionTemplate): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveDeflectionTemplateCodePrefixRule implements AdaptiveDeflectionTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveDeflectionTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveDeflectionTemplateRequiredCodeRule implements AdaptiveDeflectionTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveDeflectionTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveDeflectionTemplateFrequencyCapRangeRule implements AdaptiveDeflectionTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveDeflectionTemplate): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveDeflectionTemplateCodeLengthRule implements AdaptiveDeflectionTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveDeflectionTemplate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive deflection template. */
export class AdaptiveDeflectionTemplateValidator {
  rules: AdaptiveDeflectionTemplateRule[];

  constructor(rules: AdaptiveDeflectionTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveDeflectionTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveDeflectionTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveDeflectionTemplate[]): Map<string, string[]> {
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

export function defaultAdaptiveDeflectionTemplateValidator(): AdaptiveDeflectionTemplateValidator {
  return new AdaptiveDeflectionTemplateValidator(
    [
      new AdaptiveDeflectionTemplateRequiredTitleRule("adaptive deflection template needs this field"),
      new AdaptiveDeflectionTemplateTitleLengthRule(3600),
      new AdaptiveDeflectionTemplateCodePrefixRule("ACM"),
      new AdaptiveDeflectionTemplateRequiredCodeRule("adaptive deflection template needs this field"),
      new AdaptiveDeflectionTemplateFrequencyCapRangeRule(120, 1000),
      new AdaptiveDeflectionTemplateCodeLengthRule(16),
    ],
  );
}
