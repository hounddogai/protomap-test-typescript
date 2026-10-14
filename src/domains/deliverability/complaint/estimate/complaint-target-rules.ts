import * as text from "../../../../kit/text.js";
import { ComplaintTarget } from "./complaint-target.js";

/** A rule a complaint target must pass. Check returns its problems, or none. */
export interface ComplaintTargetRule {
  check(item: ComplaintTarget): string[];
}

export class ComplaintTargetCodePrefixRule implements ComplaintTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ComplaintTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ComplaintTargetAllowedCodeRule implements ComplaintTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ComplaintTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class ComplaintTargetRequiredCodeRule implements ComplaintTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a complaint target. */
export class ComplaintTargetValidator {
  rules: ComplaintTargetRule[];

  constructor(rules: ComplaintTargetRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintTarget): string[] {
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

  requireValid(item: ComplaintTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintTarget[]): Map<string, string[]> {
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

export function defaultComplaintTargetValidator(): ComplaintTargetValidator {
  return new ComplaintTargetValidator(
    [
      new ComplaintTargetCodePrefixRule("ACM"),
      new ComplaintTargetAllowedCodeRule(["legacy"]),
      new ComplaintTargetRequiredCodeRule("complaint target needs an entry"),
    ],
  );
}
