import * as text from "../../../../kit/text.js";
import { GlobalComplaintOverride } from "./global-complaint-override.js";

/** A rule a global complaint override must pass. Check returns its problems, or none. */
export interface GlobalComplaintOverrideRule {
  check(item: GlobalComplaintOverride): string[];
}

export class GlobalComplaintOverrideChannelLengthRule implements GlobalComplaintOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalComplaintOverride): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalComplaintOverrideCodeLengthRule implements GlobalComplaintOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalComplaintOverride): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalComplaintOverrideTitleLengthRule implements GlobalComplaintOverrideRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalComplaintOverride): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalComplaintOverrideRequiredCodeRule implements GlobalComplaintOverrideRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalComplaintOverride): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalComplaintOverrideAllowedTitleRule implements GlobalComplaintOverrideRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalComplaintOverride): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is expired`];
    return [];
  }
}

export class GlobalComplaintOverrideFrequencyCapRangeRule implements GlobalComplaintOverrideRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalComplaintOverride): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a global complaint override. */
export class GlobalComplaintOverrideValidator {
  rules: GlobalComplaintOverrideRule[];

  constructor(rules: GlobalComplaintOverrideRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalComplaintOverride): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalComplaintOverride): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalComplaintOverride[]): Map<string, string[]> {
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

export function defaultGlobalComplaintOverrideValidator(): GlobalComplaintOverrideValidator {
  return new GlobalComplaintOverrideValidator(
    [
      new GlobalComplaintOverrideChannelLengthRule(80),
      new GlobalComplaintOverrideCodeLengthRule(255),
      new GlobalComplaintOverrideTitleLengthRule(120),
      new GlobalComplaintOverrideRequiredCodeRule("global complaint override needs an entry"),
      new GlobalComplaintOverrideAllowedTitleRule(["capped", "lenient", "capped"]),
      new GlobalComplaintOverrideFrequencyCapRangeRule(120, 3600),
    ],
  );
}
