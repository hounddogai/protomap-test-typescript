import { FallbackFunnelThreshold } from "./fallback-funnel-threshold.js";

/** A rule a fallback funnel threshold must pass. Check returns its problems, or none. */
export interface FallbackFunnelThresholdRule {
  check(item: FallbackFunnelThreshold): string[];
}

export class FallbackFunnelThresholdCodeLengthRule implements FallbackFunnelThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackFunnelThreshold): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackFunnelThresholdTitleLengthRule implements FallbackFunnelThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackFunnelThreshold): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackFunnelThresholdVisibleGuardRule implements FallbackFunnelThresholdRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FallbackFunnelThreshold): string[] {
    if (item.visible && item.version > this.limit) return [`version ${item.version} exceeds ${this.limit} while visible`];
    return [];
  }
}

/** Runs every rule of a fallback funnel threshold. */
export class FallbackFunnelThresholdValidator {
  rules: FallbackFunnelThresholdRule[];

  constructor(rules: FallbackFunnelThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackFunnelThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackFunnelThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackFunnelThreshold[]): Map<string, string[]> {
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

export function defaultFallbackFunnelThresholdValidator(): FallbackFunnelThresholdValidator {
  return new FallbackFunnelThresholdValidator(
    [
      new FallbackFunnelThresholdCodeLengthRule(80),
      new FallbackFunnelThresholdTitleLengthRule(64),
      new FallbackFunnelThresholdVisibleGuardRule(80),
    ],
  );
}
