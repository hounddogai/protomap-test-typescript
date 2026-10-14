import { EscalationSegment } from "./escalation-segment.js";

/** A rule a escalation segment must pass. Check returns its problems, or none. */
export interface EscalationSegmentRule {
  check(item: EscalationSegment): string[];
}

export class EscalationSegmentCampaignRefLengthRule implements EscalationSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationSegment): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationSegmentRequiredContactEmailRule implements EscalationSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationSegment): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationSegmentCodePrefixRule implements EscalationSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EscalationSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class EscalationSegmentNameLengthRule implements EscalationSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationSegment): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a escalation segment. */
export class EscalationSegmentValidator {
  rules: EscalationSegmentRule[];

  constructor(rules: EscalationSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EscalationSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationSegment[]): Map<string, string[]> {
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

export function defaultEscalationSegmentValidator(): EscalationSegmentValidator {
  return new EscalationSegmentValidator(
    [
      new EscalationSegmentCampaignRefLengthRule(16),
      new EscalationSegmentRequiredContactEmailRule("escalation segment needs this field"),
      new EscalationSegmentCodePrefixRule("REF"),
      new EscalationSegmentNameLengthRule(32),
    ],
  );
}
