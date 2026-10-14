import * as text from "../../../../kit/text.js";
import { ConversionSegment } from "./conversion-segment.js";

/** A rule a conversion segment must pass. Check returns its problems, or none. */
export interface ConversionSegmentRule {
  check(item: ConversionSegment): string[];
}

export class ConversionSegmentCampaignRefLengthRule implements ConversionSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ConversionSegment): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ConversionSegmentRequiredCampaignRefRule implements ConversionSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionSegment): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class ConversionSegmentAllowedCodeRule implements ConversionSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ConversionSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is above maximum`];
    return [];
  }
}

export class ConversionSegmentRequiredLabelRule implements ConversionSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ConversionSegment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a conversion segment. */
export class ConversionSegmentValidator {
  rules: ConversionSegmentRule[];

  constructor(rules: ConversionSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: ConversionSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ConversionSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ConversionSegment[]): Map<string, string[]> {
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

export function defaultConversionSegmentValidator(): ConversionSegmentValidator {
  return new ConversionSegmentValidator(
    [
      new ConversionSegmentCampaignRefLengthRule(1000),
      new ConversionSegmentRequiredCampaignRefRule("conversion segment needs this field"),
      new ConversionSegmentAllowedCodeRule(["seasonal"]),
      new ConversionSegmentRequiredLabelRule("conversion segment needs this field"),
    ],
  );
}
