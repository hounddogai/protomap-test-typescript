import { StrictTouchpointNotice } from "./strict-touchpoint-notice.js";

/** A rule a strict touchpoint notice must pass. Check returns its problems, or none. */
export interface StrictTouchpointNoticeRule {
  check(item: StrictTouchpointNotice): string[];
}

export class StrictTouchpointNoticeRequiredCodeRule implements StrictTouchpointNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictTouchpointNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictTouchpointNoticeCodePrefixRule implements StrictTouchpointNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictTouchpointNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictTouchpointNoticeExpiresAtRangeRule implements StrictTouchpointNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictTouchpointNotice): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictTouchpointNoticeCreatedAtRangeRule implements StrictTouchpointNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictTouchpointNotice): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a strict touchpoint notice. */
export class StrictTouchpointNoticeValidator {
  rules: StrictTouchpointNoticeRule[];

  constructor(rules: StrictTouchpointNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: StrictTouchpointNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictTouchpointNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictTouchpointNotice[]): Map<string, string[]> {
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

export function defaultStrictTouchpointNoticeValidator(): StrictTouchpointNoticeValidator {
  return new StrictTouchpointNoticeValidator(
    [
      new StrictTouchpointNoticeRequiredCodeRule("strict touchpoint notice needs a value"),
      new StrictTouchpointNoticeCodePrefixRule("OPS"),
      new StrictTouchpointNoticeExpiresAtRangeRule(64, 1000),
      new StrictTouchpointNoticeCreatedAtRangeRule(80, 255),
    ],
  );
}
