import * as text from "../../../../kit/text.js";
import { RollingPlacementNotice } from "./rolling-placement-notice.js";

/** A rule a rolling placement notice must pass. Check returns its problems, or none. */
export interface RollingPlacementNoticeRule {
  check(item: RollingPlacementNotice): string[];
}

export class RollingPlacementNoticeAllowedNameRule implements RollingPlacementNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingPlacementNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is above maximum`];
    return [];
  }
}

export class RollingPlacementNoticeRequiredOwnerIdRule implements RollingPlacementNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingPlacementNotice): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class RollingPlacementNoticeCodeLengthRule implements RollingPlacementNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPlacementNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingPlacementNoticeBudgetRangeRule implements RollingPlacementNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingPlacementNotice): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a rolling placement notice. */
export class RollingPlacementNoticeValidator {
  rules: RollingPlacementNoticeRule[];

  constructor(rules: RollingPlacementNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: RollingPlacementNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingPlacementNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingPlacementNotice[]): Map<string, string[]> {
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

export function defaultRollingPlacementNoticeValidator(): RollingPlacementNoticeValidator {
  return new RollingPlacementNoticeValidator(
    [
      new RollingPlacementNoticeAllowedNameRule(["seasonal", "adaptive"]),
      new RollingPlacementNoticeRequiredOwnerIdRule("rolling placement notice needs a value"),
      new RollingPlacementNoticeCodeLengthRule(86400),
      new RollingPlacementNoticeBudgetRangeRule(9.8, 3710.6),
    ],
  );
}
