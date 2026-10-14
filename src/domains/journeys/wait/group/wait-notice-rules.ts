import { WaitNotice } from "./wait-notice.js";

/** A rule a wait notice must pass. Check returns its problems, or none. */
export interface WaitNoticeRule {
  check(item: WaitNotice): string[];
}

export class WaitNoticePriorityRangeRule implements WaitNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitNotice): string[] {
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

export class WaitNoticeStartsAtRangeRule implements WaitNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitNotice): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WaitNoticeThresholdRangeRule implements WaitNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WaitNotice): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class WaitNoticeCodePrefixRule implements WaitNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WaitNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WaitNoticeRequiredCodeRule implements WaitNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a wait notice. */
export class WaitNoticeValidator {
  rules: WaitNoticeRule[];

  constructor(rules: WaitNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: WaitNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WaitNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitNotice[]): Map<string, string[]> {
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

export function defaultWaitNoticeValidator(): WaitNoticeValidator {
  return new WaitNoticeValidator(
    [
      new WaitNoticePriorityRangeRule(32, 1000),
      new WaitNoticeStartsAtRangeRule(1000, 3600),
      new WaitNoticeThresholdRangeRule(0.8, 4298.2),
      new WaitNoticeCodePrefixRule("OPS"),
      new WaitNoticeRequiredCodeRule("wait notice needs an entry"),
    ],
  );
}
