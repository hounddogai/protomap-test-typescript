import { BatchedApprovalQuota } from "./batched-approval-quota.js";

/** A rule a batched approval quota must pass. Check returns its problems, or none. */
export interface BatchedApprovalQuotaRule {
  check(item: BatchedApprovalQuota): string[];
}

export class BatchedApprovalQuotaRequiredCampaignRefRule implements BatchedApprovalQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedApprovalQuota): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedApprovalQuotaTagsLimitRule implements BatchedApprovalQuotaRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: BatchedApprovalQuota): string[] {
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

export class BatchedApprovalQuotaRequiredChannelRule implements BatchedApprovalQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedApprovalQuota): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedApprovalQuotaBidRangeRule implements BatchedApprovalQuotaRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedApprovalQuota): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedApprovalQuotaRequiredTitleRule implements BatchedApprovalQuotaRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedApprovalQuota): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedApprovalQuotaTitleLengthRule implements BatchedApprovalQuotaRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedApprovalQuota): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched approval quota. */
export class BatchedApprovalQuotaValidator {
  rules: BatchedApprovalQuotaRule[];

  constructor(rules: BatchedApprovalQuotaRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedApprovalQuota): string[] {
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

  requireValid(item: BatchedApprovalQuota): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedApprovalQuota[]): Map<string, string[]> {
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

export function defaultBatchedApprovalQuotaValidator(): BatchedApprovalQuotaValidator {
  return new BatchedApprovalQuotaValidator(
    [
      new BatchedApprovalQuotaRequiredCampaignRefRule("batched approval quota needs an entry"),
      new BatchedApprovalQuotaTagsLimitRule(16, ["default", "rolling"]),
      new BatchedApprovalQuotaRequiredChannelRule("batched approval quota needs an entry"),
      new BatchedApprovalQuotaBidRangeRule(4.3, 1734.8),
      new BatchedApprovalQuotaRequiredTitleRule("batched approval quota needs a value"),
      new BatchedApprovalQuotaTitleLengthRule(120),
    ],
  );
}
