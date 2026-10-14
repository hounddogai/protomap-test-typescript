import * as text from "../../../../kit/text.js";
import { CreditNotice } from "./credit-notice.js";

/** A rule a credit notice must pass. Check returns its problems, or none. */
export interface CreditNoticeRule {
  check(item: CreditNotice): string[];
}

export class CreditNoticeConversionRateRangeRule implements CreditNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditNotice): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CreditNoticeRequiredLabelRule implements CreditNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditNotice): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class CreditNoticeRequiredOwnerIdRule implements CreditNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditNotice): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class CreditNoticeAllowedOwnerIdRule implements CreditNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreditNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is blocked`];
    return [];
  }
}

export class CreditNoticePinnedGuardRule implements CreditNoticeRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CreditNotice): string[] {
    if (item.pinned && item.impressions > this.limit) return [`impressions ${item.impressions} exceeds ${this.limit} while pinned`];
    return [];
  }
}

/** Runs every rule of a credit notice. */
export class CreditNoticeValidator {
  rules: CreditNoticeRule[];

  constructor(rules: CreditNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: CreditNotice): string[] {
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

  requireValid(item: CreditNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditNotice[]): Map<string, string[]> {
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

export function defaultCreditNoticeValidator(): CreditNoticeValidator {
  return new CreditNoticeValidator(
    [
      new CreditNoticeConversionRateRangeRule(0.6, 2328.6),
      new CreditNoticeRequiredLabelRule("credit notice needs a value"),
      new CreditNoticeRequiredOwnerIdRule("credit notice needs an entry"),
      new CreditNoticeAllowedOwnerIdRule(["primary"]),
      new CreditNoticePinnedGuardRule(120),
    ],
  );
}
