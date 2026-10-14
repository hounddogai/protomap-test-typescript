import * as text from "../../../../kit/text.js";
import { PayoutBundle } from "./payout-bundle.js";

/** A rule a payout bundle must pass. Check returns its problems, or none. */
export interface PayoutBundleRule {
  check(item: PayoutBundle): string[];
}

export class PayoutBundleRequiredAudienceIdRule implements PayoutBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutBundle): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutBundleRequiredCodeRule implements PayoutBundleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutBundle): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutBundleAllowedAudienceIdRule implements PayoutBundleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PayoutBundle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.audienceId))) return [`audience id ${item.audienceId} is inconsistent`];
    return [];
  }
}

export class PayoutBundleTagsLimitRule implements PayoutBundleRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: PayoutBundle): string[] {
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

/** Runs every rule of a payout bundle. */
export class PayoutBundleValidator {
  rules: PayoutBundleRule[];

  constructor(rules: PayoutBundleRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutBundle): string[] {
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

  requireValid(item: PayoutBundle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutBundle[]): Map<string, string[]> {
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

export function defaultPayoutBundleValidator(): PayoutBundleValidator {
  return new PayoutBundleValidator(
    [
      new PayoutBundleRequiredAudienceIdRule("payout bundle needs this field"),
      new PayoutBundleRequiredCodeRule("payout bundle needs this field"),
      new PayoutBundleAllowedAudienceIdRule(["strict", "fallback"]),
      new PayoutBundleTagsLimitRule(120, ["capped"]),
    ],
  );
}
