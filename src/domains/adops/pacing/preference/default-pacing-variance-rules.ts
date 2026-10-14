import * as text from "../../../../kit/text.js";
import { DefaultPacingVariance } from "./default-pacing-variance.js";

/** A rule a default pacing variance must pass. Check returns its problems, or none. */
export interface DefaultPacingVarianceRule {
  check(item: DefaultPacingVariance): string[];
}

export class DefaultPacingVarianceArchivedGuardRule implements DefaultPacingVarianceRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: DefaultPacingVariance): string[] {
    if (item.archived && item.discount > this.limit) return [`discount ${item.discount} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class DefaultPacingVarianceCodeLengthRule implements DefaultPacingVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPacingVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultPacingVarianceRequiredCodeRule implements DefaultPacingVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPacingVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPacingVarianceAllowedVariantRule implements DefaultPacingVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultPacingVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.variant))) return [`variant ${item.variant} is too long`];
    return [];
  }
}

export class DefaultPacingVariancePriorityRangeRule implements DefaultPacingVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultPacingVariance): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a default pacing variance. */
export class DefaultPacingVarianceValidator {
  rules: DefaultPacingVarianceRule[];

  constructor(rules: DefaultPacingVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultPacingVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultPacingVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultPacingVariance[]): Map<string, string[]> {
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

export function defaultDefaultPacingVarianceValidator(): DefaultPacingVarianceValidator {
  return new DefaultPacingVarianceValidator(
    [
      new DefaultPacingVarianceArchivedGuardRule(9.3),
      new DefaultPacingVarianceCodeLengthRule(86400),
      new DefaultPacingVarianceRequiredCodeRule("default pacing variance needs a value"),
      new DefaultPacingVarianceAllowedVariantRule(["adaptive"]),
      new DefaultPacingVariancePriorityRangeRule(1000, 1000),
    ],
  );
}
