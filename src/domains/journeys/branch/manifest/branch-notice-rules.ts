import { BranchNotice } from "./branch-notice.js";

/** A rule a branch notice must pass. Check returns its problems, or none. */
export interface BranchNoticeRule {
  check(item: BranchNotice): string[];
}

export class BranchNoticeRequiredCodeRule implements BranchNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BranchNoticeRequiredCampaignRefRule implements BranchNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchNotice): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class BranchNoticeCodePrefixRule implements BranchNoticeRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BranchNotice): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a branch notice. */
export class BranchNoticeValidator {
  rules: BranchNoticeRule[];

  constructor(rules: BranchNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: BranchNotice): string[] {
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

  requireValid(item: BranchNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchNotice[]): Map<string, string[]> {
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

export function defaultBranchNoticeValidator(): BranchNoticeValidator {
  return new BranchNoticeValidator(
    [
      new BranchNoticeRequiredCodeRule("branch notice needs a value"),
      new BranchNoticeRequiredCampaignRefRule("branch notice needs a value"),
      new BranchNoticeCodePrefixRule("X"),
    ],
  );
}
