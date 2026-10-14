import * as text from "../../../../kit/text.js";
import { PostBundle } from "./post-bundle.js";

/** A rule a post bundle must pass. Check returns its problems, or none. */
export interface PostBundleRule {
  check(item: PostBundle): string[];
}

export class PostBundleClicksRangeRule implements PostBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PostBundle): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PostBundleAllowedCountryRule implements PostBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PostBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is below minimum`];
    return [];
  }
}

export class PostBundleRequiredCodeRule implements PostBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PostBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PostBundleCodeLengthRule implements PostBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostBundle): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PostBundleAudienceIdLengthRule implements PostBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PostBundle): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a post bundle. */
export class PostBundleValidator {
  rules: PostBundleRule[];

  constructor(rules: PostBundleRule[]) {
    this.rules = rules;
  }

  validate(item: PostBundle): string[] {
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

  requireValid(item: PostBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PostBundle[]): Map<string, string[]> {
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

export function defaultPostBundleValidator(): PostBundleValidator {
  return new PostBundleValidator(
    [
      new PostBundleClicksRangeRule(1000, 1000),
      new PostBundleAllowedCountryRule(["seasonal"]),
      new PostBundleRequiredCodeRule("post bundle needs a value"),
      new PostBundleCodeLengthRule(64),
      new PostBundleAudienceIdLengthRule(86400),
    ],
  );
}
