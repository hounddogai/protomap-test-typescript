import { StrictCreativeAllocation } from "./strict-creative-allocation.js";

/** A rule a strict creative allocation must pass. Check returns its problems, or none. */
export interface StrictCreativeAllocationRule {
  check(item: StrictCreativeAllocation): string[];
}

export class StrictCreativeAllocationCampaignRefLengthRule implements StrictCreativeAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictCreativeAllocation): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictCreativeAllocationCodePrefixRule implements StrictCreativeAllocationRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictCreativeAllocation): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictCreativeAllocationAudienceIdLengthRule implements StrictCreativeAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictCreativeAllocation): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict creative allocation. */
export class StrictCreativeAllocationValidator {
  rules: StrictCreativeAllocationRule[];

  constructor(rules: StrictCreativeAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: StrictCreativeAllocation): string[] {
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

  requireValid(item: StrictCreativeAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictCreativeAllocation[]): Map<string, string[]> {
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

export function defaultStrictCreativeAllocationValidator(): StrictCreativeAllocationValidator {
  return new StrictCreativeAllocationValidator(
    [
      new StrictCreativeAllocationCampaignRefLengthRule(64),
      new StrictCreativeAllocationCodePrefixRule("Q"),
      new StrictCreativeAllocationAudienceIdLengthRule(86400),
    ],
  );
}
