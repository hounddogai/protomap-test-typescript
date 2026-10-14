import { PendingWarmupAudit } from "./pending-warmup-audit.js";

/** A rule a pending warmup audit must pass. Check returns its problems, or none. */
export interface PendingWarmupAuditRule {
  check(item: PendingWarmupAudit): string[];
}

export class PendingWarmupAuditThresholdRangeRule implements PendingWarmupAuditRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingWarmupAudit): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingWarmupAuditApprovedGuardRule implements PendingWarmupAuditRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PendingWarmupAudit): string[] {
    if (item.approved && item.batchSize > this.limit) return [`batch size ${item.batchSize} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class PendingWarmupAuditTagsLimitRule implements PendingWarmupAuditRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: PendingWarmupAudit): string[] {
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

export class PendingWarmupAuditRequiredCodeRule implements PendingWarmupAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingWarmupAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pending warmup audit. */
export class PendingWarmupAuditValidator {
  rules: PendingWarmupAuditRule[];

  constructor(rules: PendingWarmupAuditRule[]) {
    this.rules = rules;
  }

  validate(item: PendingWarmupAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingWarmupAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingWarmupAudit[]): Map<string, string[]> {
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

export function defaultPendingWarmupAuditValidator(): PendingWarmupAuditValidator {
  return new PendingWarmupAuditValidator(
    [
      new PendingWarmupAuditThresholdRangeRule(3.1, 4295.9),
      new PendingWarmupAuditApprovedGuardRule(1000),
      new PendingWarmupAuditTagsLimitRule(64, ["pending", "manual"]),
      new PendingWarmupAuditRequiredCodeRule("pending warmup audit needs an entry"),
    ],
  );
}
