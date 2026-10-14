import * as text from "../../../../kit/text.js";
import { TieredComplaintBundle } from "./tiered-complaint-bundle.js";

/** A rule a tiered complaint bundle must pass. Check returns its problems, or none. */
export interface TieredComplaintBundleRule {
  check(item: TieredComplaintBundle): string[];
}

export class TieredComplaintBundleAmountRangeRule implements TieredComplaintBundleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredComplaintBundle): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredComplaintBundleChecksumLengthRule implements TieredComplaintBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredComplaintBundle): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredComplaintBundleAllowedNameRule implements TieredComplaintBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredComplaintBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is out of range`];
    return [];
  }
}

export class TieredComplaintBundleTagsLimitRule implements TieredComplaintBundleRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: TieredComplaintBundle): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class TieredComplaintBundleChannelLengthRule implements TieredComplaintBundleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredComplaintBundle): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered complaint bundle. */
export class TieredComplaintBundleValidator {
  rules: TieredComplaintBundleRule[];

  constructor(rules: TieredComplaintBundleRule[]) {
    this.rules = rules;
  }

  validate(item: TieredComplaintBundle): string[] {
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

  requireValid(item: TieredComplaintBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredComplaintBundle[]): Map<string, string[]> {
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

export function defaultTieredComplaintBundleValidator(): TieredComplaintBundleValidator {
  return new TieredComplaintBundleValidator(
    [
      new TieredComplaintBundleAmountRangeRule(9.2, 3404.9),
      new TieredComplaintBundleChecksumLengthRule(255),
      new TieredComplaintBundleAllowedNameRule(["seasonal"]),
      new TieredComplaintBundleTagsLimitRule(120, ["default", "lenient"]),
      new TieredComplaintBundleChannelLengthRule(86400),
    ],
  );
}
