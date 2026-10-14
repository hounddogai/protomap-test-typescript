import { SubscriptionTemplate } from "./subscription-template.js";

/** A rule a subscription template must pass. Check returns its problems, or none. */
export interface SubscriptionTemplateRule {
  check(item: SubscriptionTemplate): string[];
}

export class SubscriptionTemplateCodePrefixRule implements SubscriptionTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SubscriptionTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SubscriptionTemplateImpressionsRangeRule implements SubscriptionTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionTemplate): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SubscriptionTemplateBudgetRangeRule implements SubscriptionTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionTemplate): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SubscriptionTemplateCodeLengthRule implements SubscriptionTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionTemplate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SubscriptionTemplateCeilingRangeRule implements SubscriptionTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionTemplate): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a subscription template. */
export class SubscriptionTemplateValidator {
  rules: SubscriptionTemplateRule[];

  constructor(rules: SubscriptionTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SubscriptionTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionTemplate[]): Map<string, string[]> {
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

export function defaultSubscriptionTemplateValidator(): SubscriptionTemplateValidator {
  return new SubscriptionTemplateValidator(
    [
      new SubscriptionTemplateCodePrefixRule("REF"),
      new SubscriptionTemplateImpressionsRangeRule(1000, 3600),
      new SubscriptionTemplateBudgetRangeRule(5, 4411),
      new SubscriptionTemplateCodeLengthRule(80),
      new SubscriptionTemplateCeilingRangeRule(7.2, 714.2),
    ],
  );
}
