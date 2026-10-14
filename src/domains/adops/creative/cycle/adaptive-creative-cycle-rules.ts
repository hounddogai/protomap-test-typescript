import * as text from "../../../../kit/text.js";
import { AdaptiveCreativeCycle } from "./adaptive-creative-cycle.js";

/** A rule a adaptive creative cycle must pass. Check returns its problems, or none. */
export interface AdaptiveCreativeCycleRule {
  check(item: AdaptiveCreativeCycle): string[];
}

export class AdaptiveCreativeCyclePinnedGuardRule implements AdaptiveCreativeCycleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: AdaptiveCreativeCycle): string[] {
    if (item.pinned && item.limit > this.limit) return [`limit ${item.limit} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class AdaptiveCreativeCycleLimitRangeRule implements AdaptiveCreativeCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveCreativeCycle): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveCreativeCycleSegmentLengthRule implements AdaptiveCreativeCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveCreativeCycle): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveCreativeCycleAllowedSegmentRule implements AdaptiveCreativeCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveCreativeCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is not allowed`];
    return [];
  }
}

export class AdaptiveCreativeCycleSendAtRangeRule implements AdaptiveCreativeCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveCreativeCycle): string[] {
    const value = item.sendAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`send at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`send at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a adaptive creative cycle. */
export class AdaptiveCreativeCycleValidator {
  rules: AdaptiveCreativeCycleRule[];

  constructor(rules: AdaptiveCreativeCycleRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveCreativeCycle): string[] {
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

  requireValid(item: AdaptiveCreativeCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveCreativeCycle[]): Map<string, string[]> {
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

export function defaultAdaptiveCreativeCycleValidator(): AdaptiveCreativeCycleValidator {
  return new AdaptiveCreativeCycleValidator(
    [
      new AdaptiveCreativeCyclePinnedGuardRule(120),
      new AdaptiveCreativeCycleLimitRangeRule(255, 255),
      new AdaptiveCreativeCycleSegmentLengthRule(1000),
      new AdaptiveCreativeCycleAllowedSegmentRule([]),
      new AdaptiveCreativeCycleSendAtRangeRule(80, 3600),
    ],
  );
}
