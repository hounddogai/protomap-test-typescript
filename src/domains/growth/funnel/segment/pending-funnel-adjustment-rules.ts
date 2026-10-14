import { PendingFunnelAdjustment } from "./pending-funnel-adjustment.js";

/** A rule a pending funnel adjustment must pass. Check returns its problems, or none. */
export interface PendingFunnelAdjustmentRule {
  check(item: PendingFunnelAdjustment): string[];
}

export class PendingFunnelAdjustmentCodePrefixRule implements PendingFunnelAdjustmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingFunnelAdjustment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PendingFunnelAdjustmentRequiredChecksumRule implements PendingFunnelAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingFunnelAdjustment): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class PendingFunnelAdjustmentQuantityRangeRule implements PendingFunnelAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingFunnelAdjustment): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingFunnelAdjustmentRequiredTitleRule implements PendingFunnelAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingFunnelAdjustment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PendingFunnelAdjustmentActiveGuardRule implements PendingFunnelAdjustmentRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PendingFunnelAdjustment): string[] {
    if (item.active && item.impressions > this.limit) return [`impressions ${item.impressions} exceeds ${this.limit} while active`];
    return [];
  }
}

/** Runs every rule of a pending funnel adjustment. */
export class PendingFunnelAdjustmentValidator {
  rules: PendingFunnelAdjustmentRule[];

  constructor(rules: PendingFunnelAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: PendingFunnelAdjustment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingFunnelAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingFunnelAdjustment[]): Map<string, string[]> {
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

export function defaultPendingFunnelAdjustmentValidator(): PendingFunnelAdjustmentValidator {
  return new PendingFunnelAdjustmentValidator(
    [
      new PendingFunnelAdjustmentCodePrefixRule("X"),
      new PendingFunnelAdjustmentRequiredChecksumRule("pending funnel adjustment needs this field"),
      new PendingFunnelAdjustmentQuantityRangeRule(64, 255),
      new PendingFunnelAdjustmentRequiredTitleRule("pending funnel adjustment needs a value"),
      new PendingFunnelAdjustmentActiveGuardRule(86400),
    ],
  );
}
