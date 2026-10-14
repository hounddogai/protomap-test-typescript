import * as text from "../../../../kit/text.js";
import { TieredBranchNotice } from "./tiered-branch-notice.js";

/** A rule a tiered branch notice must pass. Check returns its problems, or none. */
export interface TieredBranchNoticeRule {
  check(item: TieredBranchNotice): string[];
}

export class TieredBranchNoticeTitleLengthRule implements TieredBranchNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredBranchNotice): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredBranchNoticeRequiredSourceRule implements TieredBranchNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredBranchNotice): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class TieredBranchNoticeCodeLengthRule implements TieredBranchNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredBranchNotice): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredBranchNoticeSegmentLengthRule implements TieredBranchNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredBranchNotice): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredBranchNoticeRequiredTitleRule implements TieredBranchNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredBranchNotice): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class TieredBranchNoticeAllowedTitleRule implements TieredBranchNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredBranchNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is too long`];
    return [];
  }
}

/** Runs every rule of a tiered branch notice. */
export class TieredBranchNoticeValidator {
  rules: TieredBranchNoticeRule[];

  constructor(rules: TieredBranchNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: TieredBranchNotice): string[] {
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

  requireValid(item: TieredBranchNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredBranchNotice[]): Map<string, string[]> {
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

export function defaultTieredBranchNoticeValidator(): TieredBranchNoticeValidator {
  return new TieredBranchNoticeValidator(
    [
      new TieredBranchNoticeTitleLengthRule(1000),
      new TieredBranchNoticeRequiredSourceRule("tiered branch notice needs an entry"),
      new TieredBranchNoticeCodeLengthRule(1000),
      new TieredBranchNoticeSegmentLengthRule(80),
      new TieredBranchNoticeRequiredTitleRule("tiered branch notice needs a value"),
      new TieredBranchNoticeAllowedTitleRule(["strict", "batched", "seasonal"]),
    ],
  );
}
