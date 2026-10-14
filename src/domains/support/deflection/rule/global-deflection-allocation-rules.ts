import * as text from "../../../../kit/text.js";
import { GlobalDeflectionAllocation } from "./global-deflection-allocation.js";

/** A rule a global deflection allocation must pass. Check returns its problems, or none. */
export interface GlobalDeflectionAllocationRule {
  check(item: GlobalDeflectionAllocation): string[];
}

export class GlobalDeflectionAllocationRequiredNameRule implements GlobalDeflectionAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalDeflectionAllocation): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalDeflectionAllocationNameLengthRule implements GlobalDeflectionAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalDeflectionAllocation): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalDeflectionAllocationCodePrefixRule implements GlobalDeflectionAllocationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalDeflectionAllocation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalDeflectionAllocationAllowedNameRule implements GlobalDeflectionAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalDeflectionAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is below minimum`];
    return [];
  }
}

/** Runs every rule of a global deflection allocation. */
export class GlobalDeflectionAllocationValidator {
  rules: GlobalDeflectionAllocationRule[];

  constructor(rules: GlobalDeflectionAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalDeflectionAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalDeflectionAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalDeflectionAllocation[]): Map<string, string[]> {
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

export function defaultGlobalDeflectionAllocationValidator(): GlobalDeflectionAllocationValidator {
  return new GlobalDeflectionAllocationValidator(
    [
      new GlobalDeflectionAllocationRequiredNameRule("global deflection allocation needs this field"),
      new GlobalDeflectionAllocationNameLengthRule(16),
      new GlobalDeflectionAllocationCodePrefixRule("ACM"),
      new GlobalDeflectionAllocationAllowedNameRule(["batched", "scheduled", "scheduled"]),
    ],
  );
}
