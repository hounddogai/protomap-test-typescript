import * as text from "../../../../kit/text.js";
import { GlobalInsightSegment } from "./global-insight-segment.js";

/** A rule a global insight segment must pass. Check returns its problems, or none. */
export interface GlobalInsightSegmentRule {
  check(item: GlobalInsightSegment): string[];
}

export class GlobalInsightSegmentRequiredRegionRule implements GlobalInsightSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalInsightSegment): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalInsightSegmentCodeLengthRule implements GlobalInsightSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalInsightSegment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalInsightSegmentAllowedSourceRule implements GlobalInsightSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalInsightSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.source))) return [`source ${item.source} is above maximum`];
    return [];
  }
}

export class GlobalInsightSegmentRequiredLabelRule implements GlobalInsightSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalInsightSegment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalInsightSegmentCurrencyLengthRule implements GlobalInsightSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalInsightSegment): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global insight segment. */
export class GlobalInsightSegmentValidator {
  rules: GlobalInsightSegmentRule[];

  constructor(rules: GlobalInsightSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalInsightSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalInsightSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalInsightSegment[]): Map<string, string[]> {
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

export function defaultGlobalInsightSegmentValidator(): GlobalInsightSegmentValidator {
  return new GlobalInsightSegmentValidator(
    [
      new GlobalInsightSegmentRequiredRegionRule("global insight segment needs this field"),
      new GlobalInsightSegmentCodeLengthRule(1000),
      new GlobalInsightSegmentAllowedSourceRule(["scheduled", "seasonal"]),
      new GlobalInsightSegmentRequiredLabelRule("global insight segment needs this field"),
      new GlobalInsightSegmentCurrencyLengthRule(32),
    ],
  );
}
