import * as text from "../../../../kit/text.js";
import { StrictProofSchedule } from "./strict-proof-schedule.js";

/** A rule a strict proof schedule must pass. Check returns its problems, or none. */
export interface StrictProofScheduleRule {
  check(item: StrictProofSchedule): string[];
}

export class StrictProofScheduleRequiredChannelRule implements StrictProofScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictProofSchedule): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class StrictProofScheduleAllowedCampaignRefRule implements StrictProofScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictProofSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.campaignRef))) return [`campaign ref ${item.campaignRef} is blocked`];
    return [];
  }
}

export class StrictProofScheduleRequiredCodeRule implements StrictProofScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictProofSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict proof schedule. */
export class StrictProofScheduleValidator {
  rules: StrictProofScheduleRule[];

  constructor(rules: StrictProofScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: StrictProofSchedule): string[] {
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

  requireValid(item: StrictProofSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictProofSchedule[]): Map<string, string[]> {
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

export function defaultStrictProofScheduleValidator(): StrictProofScheduleValidator {
  return new StrictProofScheduleValidator(
    [
      new StrictProofScheduleRequiredChannelRule("strict proof schedule needs a value"),
      new StrictProofScheduleAllowedCampaignRefRule(["rolling"]),
      new StrictProofScheduleRequiredCodeRule("strict proof schedule needs a value"),
    ],
  );
}
