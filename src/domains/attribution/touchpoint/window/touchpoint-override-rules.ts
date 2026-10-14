import { TouchpointOverride } from "./touchpoint-override.js";

/** A rule a touchpoint override must pass. Check returns its problems, or none. */
export interface TouchpointOverrideRule {
  check(item: TouchpointOverride): string[];
}

export class TouchpointOverrideCodeLengthRule implements TouchpointOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TouchpointOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TouchpointOverrideRequiredCodeRule implements TouchpointOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class TouchpointOverrideRequiredAudienceIdRule implements TouchpointOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TouchpointOverride): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class TouchpointOverrideThresholdRangeRule implements TouchpointOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TouchpointOverride): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TouchpointOverrideApprovedGuardRule implements TouchpointOverrideRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TouchpointOverride): string[] {
    if (item.approved && item.updatedAt > this.limit) return [`updated at ${item.updatedAt} exceeds ${this.limit} while approved`];
    return [];
  }
}

/** Runs every rule of a touchpoint override. */
export class TouchpointOverrideValidator {
  rules: TouchpointOverrideRule[];

  constructor(rules: TouchpointOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: TouchpointOverride): string[] {
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

  requireValid(item: TouchpointOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TouchpointOverride[]): Map<string, string[]> {
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

export function defaultTouchpointOverrideValidator(): TouchpointOverrideValidator {
  return new TouchpointOverrideValidator(
    [
      new TouchpointOverrideCodeLengthRule(86400),
      new TouchpointOverrideRequiredCodeRule("touchpoint override needs an entry"),
      new TouchpointOverrideRequiredAudienceIdRule("touchpoint override needs an entry"),
      new TouchpointOverrideThresholdRangeRule(9.2, 1369.1),
      new TouchpointOverrideApprovedGuardRule(16),
    ],
  );
}
