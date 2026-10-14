import * as text from "../../../../kit/text.js";
import { WindowMilestone } from "./window-milestone.js";

/** A rule a window milestone must pass. Check returns its problems, or none. */
export interface WindowMilestoneRule {
  check(item: WindowMilestone): string[];
}

export class WindowMilestoneCodePrefixRule implements WindowMilestoneRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WindowMilestone): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WindowMilestoneAllowedExternalRefRule implements WindowMilestoneRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WindowMilestone): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is inconsistent`];
    return [];
  }
}

export class WindowMilestoneRequiredExternalRefRule implements WindowMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WindowMilestone): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a window milestone. */
export class WindowMilestoneValidator {
  rules: WindowMilestoneRule[];

  constructor(rules: WindowMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: WindowMilestone): string[] {
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

  requireValid(item: WindowMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WindowMilestone[]): Map<string, string[]> {
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

export function defaultWindowMilestoneValidator(): WindowMilestoneValidator {
  return new WindowMilestoneValidator(
    [
      new WindowMilestoneCodePrefixRule("REF"),
      new WindowMilestoneAllowedExternalRefRule(["scheduled", "seasonal", "global"]),
      new WindowMilestoneRequiredExternalRefRule("window milestone needs a value"),
    ],
  );
}
