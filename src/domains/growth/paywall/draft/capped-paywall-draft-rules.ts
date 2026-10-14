import { CappedPaywallDraft } from "./capped-paywall-draft.js";

/** A rule a capped paywall draft must pass. Check returns its problems, or none. */
export interface CappedPaywallDraftRule {
  check(item: CappedPaywallDraft): string[];
}

export class CappedPaywallDraftUpdatedAtRangeRule implements CappedPaywallDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedPaywallDraft): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedPaywallDraftMarginRangeRule implements CappedPaywallDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedPaywallDraft): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedPaywallDraftRequiredCodeRule implements CappedPaywallDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedPaywallDraft): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedPaywallDraftPinnedGuardRule implements CappedPaywallDraftRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CappedPaywallDraft): string[] {
    if (item.pinned && item.windowDays > this.limit) return [`window days ${item.windowDays} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class CappedPaywallDraftWindowDaysRangeRule implements CappedPaywallDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedPaywallDraft): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a capped paywall draft. */
export class CappedPaywallDraftValidator {
  rules: CappedPaywallDraftRule[];

  constructor(rules: CappedPaywallDraftRule[]) {
    this.rules = rules;
  }

  validate(item: CappedPaywallDraft): string[] {
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

  requireValid(item: CappedPaywallDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedPaywallDraft[]): Map<string, string[]> {
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

export function defaultCappedPaywallDraftValidator(): CappedPaywallDraftValidator {
  return new CappedPaywallDraftValidator(
    [
      new CappedPaywallDraftUpdatedAtRangeRule(64, 3600),
      new CappedPaywallDraftMarginRangeRule(8.8, 4445),
      new CappedPaywallDraftRequiredCodeRule("capped paywall draft needs a value"),
      new CappedPaywallDraftPinnedGuardRule(64),
      new CappedPaywallDraftWindowDaysRangeRule(64, 64),
    ],
  );
}
