import { StrictExitRuleCycle } from "./strict-exit-rule-cycle.js";

/** A rule a strict exit rule cycle must pass. Check returns its problems, or none. */
export interface StrictExitRuleCycleRule {
  check(item: StrictExitRuleCycle): string[];
}

export class StrictExitRuleCycleCodePrefixRule implements StrictExitRuleCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictExitRuleCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictExitRuleCycleBidRangeRule implements StrictExitRuleCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictExitRuleCycle): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictExitRuleCycleCostRangeRule implements StrictExitRuleCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictExitRuleCycle): string[] {
    const value = item.cost;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`cost ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`cost ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictExitRuleCycleRequiredSummaryRule implements StrictExitRuleCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictExitRuleCycle): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class StrictExitRuleCycleCampaignRefLengthRule implements StrictExitRuleCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictExitRuleCycle): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a strict exit rule cycle. */
export class StrictExitRuleCycleValidator {
  rules: StrictExitRuleCycleRule[];

  constructor(rules: StrictExitRuleCycleRule[]) {
    this.rules = rules;
  }

  validate(item: StrictExitRuleCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictExitRuleCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictExitRuleCycle[]): Map<string, string[]> {
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

export function defaultStrictExitRuleCycleValidator(): StrictExitRuleCycleValidator {
  return new StrictExitRuleCycleValidator(
    [
      new StrictExitRuleCycleCodePrefixRule("OPS"),
      new StrictExitRuleCycleBidRangeRule(0.9, 2132.5),
      new StrictExitRuleCycleCostRangeRule(2.5, 3146.7),
      new StrictExitRuleCycleRequiredSummaryRule("strict exit rule cycle needs an entry"),
      new StrictExitRuleCycleCampaignRefLengthRule(86400),
    ],
  );
}
