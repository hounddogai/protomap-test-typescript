import { PendingBidRuleSegment } from "./pending-bid-rule-segment.js";

/** A rule a pending bid rule segment must pass. Check returns its problems, or none. */
export interface PendingBidRuleSegmentRule {
  check(item: PendingBidRuleSegment): string[];
}

export class PendingBidRuleSegmentCodePrefixRule implements PendingBidRuleSegmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingBidRuleSegment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingBidRuleSegmentRequiredChannelRule implements PendingBidRuleSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingBidRuleSegment): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class PendingBidRuleSegmentRequiredJourneyIdRule implements PendingBidRuleSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingBidRuleSegment): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending bid rule segment. */
export class PendingBidRuleSegmentValidator {
  rules: PendingBidRuleSegmentRule[];

  constructor(rules: PendingBidRuleSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: PendingBidRuleSegment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingBidRuleSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingBidRuleSegment[]): Map<string, string[]> {
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

export function defaultPendingBidRuleSegmentValidator(): PendingBidRuleSegmentValidator {
  return new PendingBidRuleSegmentValidator(
    [
      new PendingBidRuleSegmentCodePrefixRule("REF"),
      new PendingBidRuleSegmentRequiredChannelRule("pending bid rule segment needs a value"),
      new PendingBidRuleSegmentRequiredJourneyIdRule("pending bid rule segment needs a value"),
    ],
  );
}
