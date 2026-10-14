import { StrictBadgePlan } from "./strict-badge-plan.js";

/** A rule a strict badge plan must pass. Check returns its problems, or none. */
export interface StrictBadgePlanRule {
  check(item: StrictBadgePlan): string[];
}

export class StrictBadgePlanRequiredSegmentRule implements StrictBadgePlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictBadgePlan): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class StrictBadgePlanApprovedGuardRule implements StrictBadgePlanRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: StrictBadgePlan): string[] {
    if (item.approved && item.impressions > this.limit) return [`impressions ${item.impressions} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class StrictBadgePlanCodePrefixRule implements StrictBadgePlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictBadgePlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictBadgePlanRequiredCampaignRefRule implements StrictBadgePlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictBadgePlan): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict badge plan. */
export class StrictBadgePlanValidator {
  rules: StrictBadgePlanRule[];

  constructor(rules: StrictBadgePlanRule[]) {
    this.rules = rules;
  }

  validate(item: StrictBadgePlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictBadgePlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictBadgePlan[]): Map<string, string[]> {
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

export function defaultStrictBadgePlanValidator(): StrictBadgePlanValidator {
  return new StrictBadgePlanValidator(
    [
      new StrictBadgePlanRequiredSegmentRule("strict badge plan needs a value"),
      new StrictBadgePlanApprovedGuardRule(32),
      new StrictBadgePlanCodePrefixRule("X"),
      new StrictBadgePlanRequiredCampaignRefRule("strict badge plan needs this field"),
    ],
  );
}
