import * as text from "../../../../kit/text.js";
import { ActivationNotice } from "./activation-notice.js";

/** A rule a activation notice must pass. Check returns its problems, or none. */
export interface ActivationNoticeRule {
  check(item: ActivationNotice): string[];
}

export class ActivationNoticeNameLengthRule implements ActivationNoticeRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ActivationNotice): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ActivationNoticeRequiredLabelRule implements ActivationNoticeRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationNotice): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationNoticeAllowedLocaleRule implements ActivationNoticeRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ActivationNotice): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is expired`];
    return [];
  }
}

/** Runs every rule of a activation notice. */
export class ActivationNoticeValidator {
  rules: ActivationNoticeRule[];

  constructor(rules: ActivationNoticeRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationNotice): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ActivationNotice): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationNotice[]): Map<string, string[]> {
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

export function defaultActivationNoticeValidator(): ActivationNoticeValidator {
  return new ActivationNoticeValidator(
    [
      new ActivationNoticeNameLengthRule(32),
      new ActivationNoticeRequiredLabelRule("activation notice needs this field"),
      new ActivationNoticeAllowedLocaleRule([]),
    ],
  );
}
