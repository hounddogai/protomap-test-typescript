import { WarmupNotice } from "./warmup-notice.js";

/** A rule a warmup notice must pass. Check returns its problems, or none. */
export interface WarmupNoticeRule {
  check(item: WarmupNotice): string[];
}

export class WarmupNoticeRequiredNameRule implements WarmupNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupNotice): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupNoticeMaximumRangeRule implements WarmupNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupNotice): string[] {
    const value = item.maximum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`maximum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`maximum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WarmupNoticeLimitRangeRule implements WarmupNoticeRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WarmupNotice): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class WarmupNoticeRequiredCodeRule implements WarmupNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupNotice): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a warmup notice. */
export class WarmupNoticeValidator {
  rules: WarmupNoticeRule[];

  constructor(rules: WarmupNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupNotice): string[] {
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

  requireValid(item: WarmupNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupNotice[]): Map<string, string[]> {
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

export function defaultWarmupNoticeValidator(): WarmupNoticeValidator {
  return new WarmupNoticeValidator(
    [
      new WarmupNoticeRequiredNameRule("warmup notice needs an entry"),
      new WarmupNoticeMaximumRangeRule(6.4, 2800.8),
      new WarmupNoticeLimitRangeRule(120, 3600),
      new WarmupNoticeRequiredCodeRule("warmup notice needs an entry"),
    ],
  );
}
