import * as text from "../../../../kit/text.js";
import { WeightedJourneyNotice } from "./weighted-journey-notice.js";

/** A rule a weighted journey notice must pass. Check returns its problems, or none. */
export interface WeightedJourneyNoticeRule {
  check(item: WeightedJourneyNotice): string[];
}

export class WeightedJourneyNoticeAllowedNameRule implements WeightedJourneyNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedJourneyNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is below minimum`];
    return [];
  }
}

export class WeightedJourneyNoticeLabelLengthRule implements WeightedJourneyNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedJourneyNotice): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedJourneyNoticeRequiredSourceRule implements WeightedJourneyNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedJourneyNotice): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a weighted journey notice. */
export class WeightedJourneyNoticeValidator {
  rules: WeightedJourneyNoticeRule[];

  constructor(rules: WeightedJourneyNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedJourneyNotice): string[] {
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

  requireValid(item: WeightedJourneyNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedJourneyNotice[]): Map<string, string[]> {
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

export function defaultWeightedJourneyNoticeValidator(): WeightedJourneyNoticeValidator {
  return new WeightedJourneyNoticeValidator(
    [
      new WeightedJourneyNoticeAllowedNameRule(["capped", "scheduled", "lenient"]),
      new WeightedJourneyNoticeLabelLengthRule(120),
      new WeightedJourneyNoticeRequiredSourceRule("weighted journey notice needs this field"),
    ],
  );
}
