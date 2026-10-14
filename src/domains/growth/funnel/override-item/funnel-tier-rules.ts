import { FunnelTier } from "./funnel-tier.js";

/** A rule a funnel tier must pass. Check returns its problems, or none. */
export interface FunnelTierRule {
  check(item: FunnelTier): string[];
}

export class FunnelTierRequiredChannelRule implements FunnelTierRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelTier): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class FunnelTierOpenRateRangeRule implements FunnelTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelTier): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FunnelTierPriorityRangeRule implements FunnelTierRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelTier): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a funnel tier. */
export class FunnelTierValidator {
  rules: FunnelTierRule[];

  constructor(rules: FunnelTierRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelTier): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FunnelTier): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelTier[]): Map<string, string[]> {
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

export function defaultFunnelTierValidator(): FunnelTierValidator {
  return new FunnelTierValidator(
    [
      new FunnelTierRequiredChannelRule("funnel tier needs this field"),
      new FunnelTierOpenRateRangeRule(4.1, 2132.2),
      new FunnelTierPriorityRangeRule(80, 3600),
    ],
  );
}
