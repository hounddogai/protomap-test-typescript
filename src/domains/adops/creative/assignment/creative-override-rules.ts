import { CreativeOverride } from "./creative-override.js";

/** A rule a creative override must pass. Check returns its problems, or none. */
export interface CreativeOverrideRule {
  check(item: CreativeOverride): string[];
}

export class CreativeOverrideScoreRangeRule implements CreativeOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeOverride): string[] {
    const value = item.score;
    if (value < this.min || value > this.max) return [`score ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreativeOverrideCodePrefixRule implements CreativeOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreativeOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CreativeOverrideCodeLengthRule implements CreativeOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeOverrideLabelLengthRule implements CreativeOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeOverride): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeOverrideBudgetRangeRule implements CreativeOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreativeOverride): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a creative override. */
export class CreativeOverrideValidator {
  rules: CreativeOverrideRule[];

  constructor(rules: CreativeOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreativeOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeOverride[]): Map<string, string[]> {
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

export function defaultCreativeOverrideValidator(): CreativeOverrideValidator {
  return new CreativeOverrideValidator(
    [
      new CreativeOverrideScoreRangeRule(8.4, 1840.5),
      new CreativeOverrideCodePrefixRule("ACM"),
      new CreativeOverrideCodeLengthRule(86400),
      new CreativeOverrideLabelLengthRule(120),
      new CreativeOverrideBudgetRangeRule(6.6, 763.9),
    ],
  );
}
