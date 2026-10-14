import * as text from "../../../../kit/text.js";
import { AdaptiveCreativeBudget } from "./adaptive-creative-budget.js";

/** A rule a adaptive creative budget must pass. Check returns its problems, or none. */
export interface AdaptiveCreativeBudgetRule {
  check(item: AdaptiveCreativeBudget): string[];
}

export class AdaptiveCreativeBudgetTitleLengthRule implements AdaptiveCreativeBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveCreativeBudget): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveCreativeBudgetCodePrefixRule implements AdaptiveCreativeBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveCreativeBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveCreativeBudgetAllowedOwnerIdRule implements AdaptiveCreativeBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveCreativeBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is inconsistent`];
    return [];
  }
}

export class AdaptiveCreativeBudgetRevisionRangeRule implements AdaptiveCreativeBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveCreativeBudget): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveCreativeBudgetOwnerIdLengthRule implements AdaptiveCreativeBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveCreativeBudget): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive creative budget. */
export class AdaptiveCreativeBudgetValidator {
  rules: AdaptiveCreativeBudgetRule[];

  constructor(rules: AdaptiveCreativeBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveCreativeBudget): string[] {
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

  requireValid(item: AdaptiveCreativeBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveCreativeBudget[]): Map<string, string[]> {
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

export function defaultAdaptiveCreativeBudgetValidator(): AdaptiveCreativeBudgetValidator {
  return new AdaptiveCreativeBudgetValidator(
    [
      new AdaptiveCreativeBudgetTitleLengthRule(32),
      new AdaptiveCreativeBudgetCodePrefixRule("REF"),
      new AdaptiveCreativeBudgetAllowedOwnerIdRule(["primary"]),
      new AdaptiveCreativeBudgetRevisionRangeRule(16, 1000),
      new AdaptiveCreativeBudgetOwnerIdLengthRule(80),
    ],
  );
}
