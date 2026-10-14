import * as text from "../../../../kit/text.js";
import { StepNotice } from "./step-notice.js";

/** A rule a step notice must pass. Check returns its problems, or none. */
export interface StepNoticeRule {
  check(item: StepNotice): string[];
}

export class StepNoticeImpressionsRangeRule implements StepNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepNotice): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StepNoticeAllowedNameRule implements StepNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StepNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is out of range`];
    return [];
  }
}

export class StepNoticePriorityRangeRule implements StepNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StepNotice): string[] {
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

/** Runs every rule of a step notice. */
export class StepNoticeValidator {
  rules: StepNoticeRule[];

  constructor(rules: StepNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: StepNotice): string[] {
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

  requireValid(item: StepNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StepNotice[]): Map<string, string[]> {
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

export function defaultStepNoticeValidator(): StepNoticeValidator {
  return new StepNoticeValidator(
    [
      new StepNoticeImpressionsRangeRule(16, 3600),
      new StepNoticeAllowedNameRule([]),
      new StepNoticePriorityRangeRule(64, 80),
    ],
  );
}
