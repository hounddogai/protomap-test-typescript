import * as text from "../../../../kit/text.js";
import { DefaultPostOverride } from "./default-post-override.js";

/** A rule a default post override must pass. Check returns its problems, or none. */
export interface DefaultPostOverrideRule {
  check(item: DefaultPostOverride): string[];
}

export class DefaultPostOverrideRequiredCodeRule implements DefaultPostOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPostOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPostOverrideRequiredSummaryRule implements DefaultPostOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultPostOverride): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultPostOverrideVariantLengthRule implements DefaultPostOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPostOverride): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultPostOverrideAllowedVariantRule implements DefaultPostOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultPostOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.variant))) return [`variant ${item.variant} is stale`];
    return [];
  }
}

export class DefaultPostOverrideTitleLengthRule implements DefaultPostOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultPostOverride): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default post override. */
export class DefaultPostOverrideValidator {
  rules: DefaultPostOverrideRule[];

  constructor(rules: DefaultPostOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultPostOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultPostOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultPostOverride[]): Map<string, string[]> {
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

export function defaultDefaultPostOverrideValidator(): DefaultPostOverrideValidator {
  return new DefaultPostOverrideValidator(
    [
      new DefaultPostOverrideRequiredCodeRule("default post override needs an entry"),
      new DefaultPostOverrideRequiredSummaryRule("default post override needs this field"),
      new DefaultPostOverrideVariantLengthRule(255),
      new DefaultPostOverrideAllowedVariantRule(["default", "capped", "legacy"]),
      new DefaultPostOverrideTitleLengthRule(3600),
    ],
  );
}
