import { ScheduledFunnelThreshold } from "./scheduled-funnel-threshold.js";

/** A rule a scheduled funnel threshold must pass. Check returns its problems, or none. */
export interface ScheduledFunnelThresholdRule {
  check(item: ScheduledFunnelThreshold): string[];
}

export class ScheduledFunnelThresholdRequiredCodeRule implements ScheduledFunnelThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledFunnelThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledFunnelThresholdTitleLengthRule implements ScheduledFunnelThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledFunnelThreshold): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledFunnelThresholdVariantLengthRule implements ScheduledFunnelThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledFunnelThreshold): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled funnel threshold. */
export class ScheduledFunnelThresholdValidator {
  rules: ScheduledFunnelThresholdRule[];

  constructor(rules: ScheduledFunnelThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledFunnelThreshold): string[] {
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

  requireValid(item: ScheduledFunnelThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledFunnelThreshold[]): Map<string, string[]> {
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

export function defaultScheduledFunnelThresholdValidator(): ScheduledFunnelThresholdValidator {
  return new ScheduledFunnelThresholdValidator(
    [
      new ScheduledFunnelThresholdRequiredCodeRule("scheduled funnel threshold needs a value"),
      new ScheduledFunnelThresholdTitleLengthRule(32),
      new ScheduledFunnelThresholdVariantLengthRule(255),
    ],
  );
}
