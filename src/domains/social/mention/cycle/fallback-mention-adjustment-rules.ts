import * as text from "../../../../kit/text.js";
import { FallbackMentionAdjustment } from "./fallback-mention-adjustment.js";

/** A rule a fallback mention adjustment must pass. Check returns its problems, or none. */
export interface FallbackMentionAdjustmentRule {
  check(item: FallbackMentionAdjustment): string[];
}

export class FallbackMentionAdjustmentRequiredCampaignRefRule implements FallbackMentionAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackMentionAdjustment): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackMentionAdjustmentRequiredLabelRule implements FallbackMentionAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackMentionAdjustment): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackMentionAdjustmentAllowedPhoneRule implements FallbackMentionAdjustmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackMentionAdjustment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.phone))) return [`phone ${item.phone} is stale`];
    return [];
  }
}

export class FallbackMentionAdjustmentRequiredPhoneRule implements FallbackMentionAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackMentionAdjustment): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback mention adjustment. */
export class FallbackMentionAdjustmentValidator {
  rules: FallbackMentionAdjustmentRule[];

  constructor(rules: FallbackMentionAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackMentionAdjustment): string[] {
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

  requireValid(item: FallbackMentionAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackMentionAdjustment[]): Map<string, string[]> {
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

export function defaultFallbackMentionAdjustmentValidator(): FallbackMentionAdjustmentValidator {
  return new FallbackMentionAdjustmentValidator(
    [
      new FallbackMentionAdjustmentRequiredCampaignRefRule("fallback mention adjustment needs this field"),
      new FallbackMentionAdjustmentRequiredLabelRule("fallback mention adjustment needs an entry"),
      new FallbackMentionAdjustmentAllowedPhoneRule(["pending", "lenient"]),
      new FallbackMentionAdjustmentRequiredPhoneRule("fallback mention adjustment needs an entry"),
    ],
  );
}
