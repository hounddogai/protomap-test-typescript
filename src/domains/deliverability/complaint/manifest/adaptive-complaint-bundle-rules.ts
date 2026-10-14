import { AdaptiveComplaintBundle } from "./adaptive-complaint-bundle.js";

/** A rule a adaptive complaint bundle must pass. Check returns its problems, or none. */
export interface AdaptiveComplaintBundleRule {
  check(item: AdaptiveComplaintBundle): string[];
}

export class AdaptiveComplaintBundleWindowDaysRangeRule implements AdaptiveComplaintBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveComplaintBundle): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveComplaintBundleNameLengthRule implements AdaptiveComplaintBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveComplaintBundle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveComplaintBundleCodeLengthRule implements AdaptiveComplaintBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveComplaintBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveComplaintBundleRequiredCampaignRefRule implements AdaptiveComplaintBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveComplaintBundle): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive complaint bundle. */
export class AdaptiveComplaintBundleValidator {
  rules: AdaptiveComplaintBundleRule[];

  constructor(rules: AdaptiveComplaintBundleRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveComplaintBundle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveComplaintBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveComplaintBundle[]): Map<string, string[]> {
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

export function defaultAdaptiveComplaintBundleValidator(): AdaptiveComplaintBundleValidator {
  return new AdaptiveComplaintBundleValidator(
    [
      new AdaptiveComplaintBundleWindowDaysRangeRule(3600, 86400),
      new AdaptiveComplaintBundleNameLengthRule(86400),
      new AdaptiveComplaintBundleCodeLengthRule(3600),
      new AdaptiveComplaintBundleRequiredCampaignRefRule("adaptive complaint bundle needs this field"),
    ],
  );
}
