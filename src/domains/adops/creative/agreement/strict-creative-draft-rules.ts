import * as text from "../../../../kit/text.js";
import { StrictCreativeDraft } from "./strict-creative-draft.js";

/** A rule a strict creative draft must pass. Check returns its problems, or none. */
export interface StrictCreativeDraftRule {
  check(item: StrictCreativeDraft): string[];
}

export class StrictCreativeDraftNameLengthRule implements StrictCreativeDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictCreativeDraft): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictCreativeDraftAllowedCodeRule implements StrictCreativeDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictCreativeDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class StrictCreativeDraftRequiredCodeRule implements StrictCreativeDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictCreativeDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictCreativeDraftCodeLengthRule implements StrictCreativeDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictCreativeDraft): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictCreativeDraftMaximumRangeRule implements StrictCreativeDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictCreativeDraft): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictCreativeDraftCodePrefixRule implements StrictCreativeDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictCreativeDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a strict creative draft. */
export class StrictCreativeDraftValidator {
  rules: StrictCreativeDraftRule[];

  constructor(rules: StrictCreativeDraftRule[]) {
    this.rules = rules;
  }

  validate(item: StrictCreativeDraft): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictCreativeDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictCreativeDraft[]): Map<string, string[]> {
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

export function defaultStrictCreativeDraftValidator(): StrictCreativeDraftValidator {
  return new StrictCreativeDraftValidator(
    [
      new StrictCreativeDraftNameLengthRule(255),
      new StrictCreativeDraftAllowedCodeRule(["adaptive", "rolling", "batched"]),
      new StrictCreativeDraftRequiredCodeRule("strict creative draft needs this field"),
      new StrictCreativeDraftCodeLengthRule(16),
      new StrictCreativeDraftMaximumRangeRule(1.3, 3553),
      new StrictCreativeDraftCodePrefixRule("ACM"),
    ],
  );
}
