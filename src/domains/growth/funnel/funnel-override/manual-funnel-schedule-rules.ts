import { ManualFunnelSchedule } from "./manual-funnel-schedule.js";

/** A rule a manual funnel schedule must pass. Check returns its problems, or none. */
export interface ManualFunnelScheduleRule {
  check(item: ManualFunnelSchedule): string[];
}

export class ManualFunnelScheduleTagsLimitRule implements ManualFunnelScheduleRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: ManualFunnelSchedule): string[] {
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

export class ManualFunnelScheduleRequiredLabelRule implements ManualFunnelScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualFunnelSchedule): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ManualFunnelScheduleCodePrefixRule implements ManualFunnelScheduleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualFunnelSchedule): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a manual funnel schedule. */
export class ManualFunnelScheduleValidator {
  rules: ManualFunnelScheduleRule[];

  constructor(rules: ManualFunnelScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: ManualFunnelSchedule): string[] {
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

  requireValid(item: ManualFunnelSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualFunnelSchedule[]): Map<string, string[]> {
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

export function defaultManualFunnelScheduleValidator(): ManualFunnelScheduleValidator {
  return new ManualFunnelScheduleValidator(
    [
      new ManualFunnelScheduleTagsLimitRule(3600, []),
      new ManualFunnelScheduleRequiredLabelRule("manual funnel schedule needs an entry"),
      new ManualFunnelScheduleCodePrefixRule("ACM"),
    ],
  );
}
