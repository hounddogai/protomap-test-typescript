import * as text from "../../../../kit/text.js";
import { RollingNudgeTarget } from "./rolling-nudge-target.js";

/** A rule a rolling nudge target must pass. Check returns its problems, or none. */
export interface RollingNudgeTargetRule {
  check(item: RollingNudgeTarget): string[];
}

export class RollingNudgeTargetAllowedTitleRule implements RollingNudgeTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingNudgeTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is out of range`];
    return [];
  }
}

export class RollingNudgeTargetRequiredCodeRule implements RollingNudgeTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingNudgeTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingNudgeTargetCodeLengthRule implements RollingNudgeTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingNudgeTarget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingNudgeTargetSendAtRangeRule implements RollingNudgeTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingNudgeTarget): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingNudgeTargetRequiredTitleRule implements RollingNudgeTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingNudgeTarget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling nudge target. */
export class RollingNudgeTargetValidator {
  rules: RollingNudgeTargetRule[];

  constructor(rules: RollingNudgeTargetRule[]) {
    this.rules = rules;
  }

  validate(item: RollingNudgeTarget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingNudgeTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingNudgeTarget[]): Map<string, string[]> {
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

export function defaultRollingNudgeTargetValidator(): RollingNudgeTargetValidator {
  return new RollingNudgeTargetValidator(
    [
      new RollingNudgeTargetAllowedTitleRule(["weighted"]),
      new RollingNudgeTargetRequiredCodeRule("rolling nudge target needs this field"),
      new RollingNudgeTargetCodeLengthRule(3600),
      new RollingNudgeTargetSendAtRangeRule(32, 86400),
      new RollingNudgeTargetRequiredTitleRule("rolling nudge target needs an entry"),
    ],
  );
}
