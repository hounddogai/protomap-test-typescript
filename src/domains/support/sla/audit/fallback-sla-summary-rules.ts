import * as text from "../../../../kit/text.js";
import { FallbackSlaSummary } from "./fallback-sla-summary.js";

/** A rule a fallback sla summary must pass. Check returns its problems, or none. */
export interface FallbackSlaSummaryRule {
  check(item: FallbackSlaSummary): string[];
}

export class FallbackSlaSummaryTitleLengthRule implements FallbackSlaSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackSlaSummary): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackSlaSummaryAllowedChannelRule implements FallbackSlaSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackSlaSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is not allowed`];
    return [];
  }
}

export class FallbackSlaSummaryPinnedGuardRule implements FallbackSlaSummaryRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: FallbackSlaSummary): string[] {
    if (item.pinned && item.batchSize > this.limit) return [`batch size ${item.batchSize} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class FallbackSlaSummaryChannelLengthRule implements FallbackSlaSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackSlaSummary): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackSlaSummaryRequiredChannelRule implements FallbackSlaSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackSlaSummary): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback sla summary. */
export class FallbackSlaSummaryValidator {
  rules: FallbackSlaSummaryRule[];

  constructor(rules: FallbackSlaSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackSlaSummary): string[] {
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

  requireValid(item: FallbackSlaSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackSlaSummary[]): Map<string, string[]> {
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

export function defaultFallbackSlaSummaryValidator(): FallbackSlaSummaryValidator {
  return new FallbackSlaSummaryValidator(
    [
      new FallbackSlaSummaryTitleLengthRule(255),
      new FallbackSlaSummaryAllowedChannelRule(["tiered", "lenient"]),
      new FallbackSlaSummaryPinnedGuardRule(86400),
      new FallbackSlaSummaryChannelLengthRule(120),
      new FallbackSlaSummaryRequiredChannelRule("fallback sla summary needs an entry"),
    ],
  );
}
