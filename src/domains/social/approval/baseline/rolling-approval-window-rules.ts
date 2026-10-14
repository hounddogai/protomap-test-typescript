import * as text from "../../../../kit/text.js";
import { RollingApprovalWindow } from "./rolling-approval-window.js";

/** A rule a rolling approval window must pass. Check returns its problems, or none. */
export interface RollingApprovalWindowRule {
  check(item: RollingApprovalWindow): string[];
}

export class RollingApprovalWindowAllowedChannelRule implements RollingApprovalWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingApprovalWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is too long`];
    return [];
  }
}

export class RollingApprovalWindowPriorityRangeRule implements RollingApprovalWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingApprovalWindow): string[] {
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

export class RollingApprovalWindowRequiredCodeRule implements RollingApprovalWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingApprovalWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingApprovalWindowCodePrefixRule implements RollingApprovalWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingApprovalWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a rolling approval window. */
export class RollingApprovalWindowValidator {
  rules: RollingApprovalWindowRule[];

  constructor(rules: RollingApprovalWindowRule[]) {
    this.rules = rules;
  }

  validate(item: RollingApprovalWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingApprovalWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingApprovalWindow[]): Map<string, string[]> {
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

export function defaultRollingApprovalWindowValidator(): RollingApprovalWindowValidator {
  return new RollingApprovalWindowValidator(
    [
      new RollingApprovalWindowAllowedChannelRule([]),
      new RollingApprovalWindowPriorityRangeRule(64, 255),
      new RollingApprovalWindowRequiredCodeRule("rolling approval window needs a value"),
      new RollingApprovalWindowCodePrefixRule("OPS"),
    ],
  );
}
