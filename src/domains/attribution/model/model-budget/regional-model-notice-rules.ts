import { RegionalModelNotice } from "./regional-model-notice.js";

/** A rule a regional model notice must pass. Check returns its problems, or none. */
export interface RegionalModelNoticeRule {
  check(item: RegionalModelNotice): string[];
}

export class RegionalModelNoticeLabelLengthRule implements RegionalModelNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalModelNotice): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalModelNoticeRequiredLocaleRule implements RegionalModelNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalModelNotice): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalModelNoticeRequiredCampaignRefRule implements RegionalModelNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalModelNotice): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional model notice. */
export class RegionalModelNoticeValidator {
  rules: RegionalModelNoticeRule[];

  constructor(rules: RegionalModelNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalModelNotice): string[] {
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

  requireValid(item: RegionalModelNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalModelNotice[]): Map<string, string[]> {
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

export function defaultRegionalModelNoticeValidator(): RegionalModelNoticeValidator {
  return new RegionalModelNoticeValidator(
    [
      new RegionalModelNoticeLabelLengthRule(3600),
      new RegionalModelNoticeRequiredLocaleRule("regional model notice needs this field"),
      new RegionalModelNoticeRequiredCampaignRefRule("regional model notice needs a value"),
    ],
  );
}
