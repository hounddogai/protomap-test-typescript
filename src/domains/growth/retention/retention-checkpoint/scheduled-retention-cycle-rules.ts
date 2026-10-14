import { ScheduledRetentionCycle } from "./scheduled-retention-cycle.js";

/** A rule a scheduled retention cycle must pass. Check returns its problems, or none. */
export interface ScheduledRetentionCycleRule {
  check(item: ScheduledRetentionCycle): string[];
}

export class ScheduledRetentionCycleLabelLengthRule implements ScheduledRetentionCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledRetentionCycle): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledRetentionCycleCodePrefixRule implements ScheduledRetentionCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledRetentionCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledRetentionCycleRequiredCampaignRefRule implements ScheduledRetentionCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledRetentionCycle): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledRetentionCycleRequiredOwnerIdRule implements ScheduledRetentionCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledRetentionCycle): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled retention cycle. */
export class ScheduledRetentionCycleValidator {
  rules: ScheduledRetentionCycleRule[];

  constructor(rules: ScheduledRetentionCycleRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledRetentionCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledRetentionCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledRetentionCycle[]): Map<string, string[]> {
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

export function defaultScheduledRetentionCycleValidator(): ScheduledRetentionCycleValidator {
  return new ScheduledRetentionCycleValidator(
    [
      new ScheduledRetentionCycleLabelLengthRule(255),
      new ScheduledRetentionCycleCodePrefixRule("REF"),
      new ScheduledRetentionCycleRequiredCampaignRefRule("scheduled retention cycle needs an entry"),
      new ScheduledRetentionCycleRequiredOwnerIdRule("scheduled retention cycle needs an entry"),
    ],
  );
}
