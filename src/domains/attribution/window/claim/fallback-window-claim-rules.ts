import * as text from "../../../../kit/text.js";
import { FallbackWindowClaim } from "./fallback-window-claim.js";

/** A rule a fallback window claim must pass. Check returns its problems, or none. */
export interface FallbackWindowClaimRule {
  check(item: FallbackWindowClaim): string[];
}

export class FallbackWindowClaimRequiredCategoryRule implements FallbackWindowClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackWindowClaim): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackWindowClaimRequiredLabelRule implements FallbackWindowClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackWindowClaim): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackWindowClaimRequiredCodeRule implements FallbackWindowClaimRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackWindowClaim): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackWindowClaimAllowedLabelRule implements FallbackWindowClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackWindowClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is above maximum`];
    return [];
  }
}

export class FallbackWindowClaimCodePrefixRule implements FallbackWindowClaimRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackWindowClaim): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a fallback window claim. */
export class FallbackWindowClaimValidator {
  rules: FallbackWindowClaimRule[];

  constructor(rules: FallbackWindowClaimRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackWindowClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackWindowClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackWindowClaim[]): Map<string, string[]> {
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

export function defaultFallbackWindowClaimValidator(): FallbackWindowClaimValidator {
  return new FallbackWindowClaimValidator(
    [
      new FallbackWindowClaimRequiredCategoryRule("fallback window claim needs this field"),
      new FallbackWindowClaimRequiredLabelRule("fallback window claim needs this field"),
      new FallbackWindowClaimRequiredCodeRule("fallback window claim needs an entry"),
      new FallbackWindowClaimAllowedLabelRule(["fallback"]),
      new FallbackWindowClaimCodePrefixRule("REF"),
    ],
  );
}
