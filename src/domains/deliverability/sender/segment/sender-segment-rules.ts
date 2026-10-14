import * as text from "../../../../kit/text.js";
import { SenderSegment } from "./sender-segment.js";

/** A rule a sender segment must pass. Check returns its problems, or none. */
export interface SenderSegmentRule {
  check(item: SenderSegment): string[];
}

export class SenderSegmentRequiredCampaignRefRule implements SenderSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderSegment): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class SenderSegmentAllowedCampaignRefRule implements SenderSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SenderSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is unknown`];
    return [];
  }
}

export class SenderSegmentLabelLengthRule implements SenderSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderSegment): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderSegmentCodeLengthRule implements SenderSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SenderSegment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SenderSegmentCodePrefixRule implements SenderSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SenderSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a sender segment. */
export class SenderSegmentValidator {
  rules: SenderSegmentRule[];

  constructor(rules: SenderSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: SenderSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SenderSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderSegment[]): Map<string, string[]> {
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

export function defaultSenderSegmentValidator(): SenderSegmentValidator {
  return new SenderSegmentValidator(
    [
      new SenderSegmentRequiredCampaignRefRule("sender segment needs a value"),
      new SenderSegmentAllowedCampaignRefRule([]),
      new SenderSegmentLabelLengthRule(86400),
      new SenderSegmentCodeLengthRule(3600),
      new SenderSegmentCodePrefixRule("REF"),
    ],
  );
}
