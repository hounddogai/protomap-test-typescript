import { DefaultSlaTemplate } from "./default-sla-template.js";

/** A rule a default sla template must pass. Check returns its problems, or none. */
export interface DefaultSlaTemplateRule {
  check(item: DefaultSlaTemplate): string[];
}

export class DefaultSlaTemplateAttemptsRangeRule implements DefaultSlaTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultSlaTemplate): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultSlaTemplateUnitLengthRule implements DefaultSlaTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultSlaTemplate): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultSlaTemplateBidRangeRule implements DefaultSlaTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultSlaTemplate): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultSlaTemplateCodePrefixRule implements DefaultSlaTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultSlaTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultSlaTemplateMaximumRangeRule implements DefaultSlaTemplateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultSlaTemplate): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a default sla template. */
export class DefaultSlaTemplateValidator {
  rules: DefaultSlaTemplateRule[];

  constructor(rules: DefaultSlaTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultSlaTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultSlaTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultSlaTemplate[]): Map<string, string[]> {
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

export function defaultDefaultSlaTemplateValidator(): DefaultSlaTemplateValidator {
  return new DefaultSlaTemplateValidator(
    [
      new DefaultSlaTemplateAttemptsRangeRule(64, 1000),
      new DefaultSlaTemplateUnitLengthRule(32),
      new DefaultSlaTemplateBidRangeRule(4.8, 3406.6),
      new DefaultSlaTemplateCodePrefixRule("OPS"),
      new DefaultSlaTemplateMaximumRangeRule(6.3, 3736.7),
    ],
  );
}
