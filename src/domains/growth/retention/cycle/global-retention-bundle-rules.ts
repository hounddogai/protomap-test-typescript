import { GlobalRetentionBundle } from "./global-retention-bundle.js";

/** A rule a global retention bundle must pass. Check returns its problems, or none. */
export interface GlobalRetentionBundleRule {
  check(item: GlobalRetentionBundle): string[];
}

export class GlobalRetentionBundleRequiredCampaignRefRule implements GlobalRetentionBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalRetentionBundle): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalRetentionBundleCodeLengthRule implements GlobalRetentionBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalRetentionBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalRetentionBundleAudienceIdLengthRule implements GlobalRetentionBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalRetentionBundle): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalRetentionBundleSequenceRangeRule implements GlobalRetentionBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalRetentionBundle): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class GlobalRetentionBundleCampaignRefLengthRule implements GlobalRetentionBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalRetentionBundle): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global retention bundle. */
export class GlobalRetentionBundleValidator {
  rules: GlobalRetentionBundleRule[];

  constructor(rules: GlobalRetentionBundleRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalRetentionBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalRetentionBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalRetentionBundle[]): Map<string, string[]> {
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

export function defaultGlobalRetentionBundleValidator(): GlobalRetentionBundleValidator {
  return new GlobalRetentionBundleValidator(
    [
      new GlobalRetentionBundleRequiredCampaignRefRule("global retention bundle needs an entry"),
      new GlobalRetentionBundleCodeLengthRule(1000),
      new GlobalRetentionBundleAudienceIdLengthRule(255),
      new GlobalRetentionBundleSequenceRangeRule(1000, 1000),
      new GlobalRetentionBundleCampaignRefLengthRule(16),
    ],
  );
}
