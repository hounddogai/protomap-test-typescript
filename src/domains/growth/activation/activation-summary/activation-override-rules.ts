import { ActivationOverride } from "./activation-override.js";

/** A rule a activation override must pass. Check returns its problems, or none. */
export interface ActivationOverrideRule {
  check(item: ActivationOverride): string[];
}

export class ActivationOverrideMinimumRangeRule implements ActivationOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ActivationOverride): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ActivationOverrideRequiredCurrencyRule implements ActivationOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationOverride): string[] {
    if (item.currency.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationOverrideCodePrefixRule implements ActivationOverrideRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ActivationOverride): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a activation override. */
export class ActivationOverrideValidator {
  rules: ActivationOverrideRule[];

  constructor(rules: ActivationOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ActivationOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationOverride[]): Map<string, string[]> {
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

export function defaultActivationOverrideValidator(): ActivationOverrideValidator {
  return new ActivationOverrideValidator(
    [
      new ActivationOverrideMinimumRangeRule(3.9, 1686.1),
      new ActivationOverrideRequiredCurrencyRule("activation override needs this field"),
      new ActivationOverrideCodePrefixRule("ACM"),
    ],
  );
}
