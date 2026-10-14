import * as text from "../../../../kit/text.js";
import { DefaultActivationTarget } from "./default-activation-target.js";

/** A rule a default activation target must pass. Check returns its problems, or none. */
export interface DefaultActivationTargetRule {
  check(item: DefaultActivationTarget): string[];
}

export class DefaultActivationTargetOpenRateRangeRule implements DefaultActivationTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultActivationTarget): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultActivationTargetMaximumRangeRule implements DefaultActivationTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultActivationTarget): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultActivationTargetRequiredSourceRule implements DefaultActivationTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultActivationTarget): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultActivationTargetAllowedSourceRule implements DefaultActivationTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultActivationTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is below minimum`];
    return [];
  }
}

/** Runs every rule of a default activation target. */
export class DefaultActivationTargetValidator {
  rules: DefaultActivationTargetRule[];

  constructor(rules: DefaultActivationTargetRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultActivationTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultActivationTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultActivationTarget[]): Map<string, string[]> {
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

export function defaultDefaultActivationTargetValidator(): DefaultActivationTargetValidator {
  return new DefaultActivationTargetValidator(
    [
      new DefaultActivationTargetOpenRateRangeRule(3.2, 2354.3),
      new DefaultActivationTargetMaximumRangeRule(8.7, 2007.6),
      new DefaultActivationTargetRequiredSourceRule("default activation target needs this field"),
      new DefaultActivationTargetAllowedSourceRule(["weighted", "regional", "regional"]),
    ],
  );
}
