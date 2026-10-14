import { AdaptiveQueueTarget } from "./adaptive-queue-target.js";

/** A rule a adaptive queue target must pass. Check returns its problems, or none. */
export interface AdaptiveQueueTargetRule {
  check(item: AdaptiveQueueTarget): string[];
}

export class AdaptiveQueueTargetImpressionsRangeRule implements AdaptiveQueueTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveQueueTarget): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveQueueTargetRequiredCampaignRefRule implements AdaptiveQueueTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveQueueTarget): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveQueueTargetTitleLengthRule implements AdaptiveQueueTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveQueueTarget): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveQueueTargetRequiredTitleRule implements AdaptiveQueueTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveQueueTarget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveQueueTargetRequiredCodeRule implements AdaptiveQueueTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveQueueTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive queue target. */
export class AdaptiveQueueTargetValidator {
  rules: AdaptiveQueueTargetRule[];

  constructor(rules: AdaptiveQueueTargetRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveQueueTarget): string[] {
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

  requireValid(item: AdaptiveQueueTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveQueueTarget[]): Map<string, string[]> {
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

export function defaultAdaptiveQueueTargetValidator(): AdaptiveQueueTargetValidator {
  return new AdaptiveQueueTargetValidator(
    [
      new AdaptiveQueueTargetImpressionsRangeRule(80, 120),
      new AdaptiveQueueTargetRequiredCampaignRefRule("adaptive queue target needs an entry"),
      new AdaptiveQueueTargetTitleLengthRule(3600),
      new AdaptiveQueueTargetRequiredTitleRule("adaptive queue target needs a value"),
      new AdaptiveQueueTargetRequiredCodeRule("adaptive queue target needs an entry"),
    ],
  );
}
