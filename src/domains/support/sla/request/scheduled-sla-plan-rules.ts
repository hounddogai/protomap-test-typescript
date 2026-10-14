import * as text from "../../../../kit/text.js";
import { ScheduledSlaPlan } from "./scheduled-sla-plan.js";

/** A rule a scheduled sla plan must pass. Check returns its problems, or none. */
export interface ScheduledSlaPlanRule {
  check(item: ScheduledSlaPlan): string[];
}

export class ScheduledSlaPlanCodePrefixRule implements ScheduledSlaPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledSlaPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledSlaPlanNameLengthRule implements ScheduledSlaPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSlaPlan): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledSlaPlanCodeLengthRule implements ScheduledSlaPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledSlaPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledSlaPlanRequiredLocaleRule implements ScheduledSlaPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledSlaPlan): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledSlaPlanAllowedCodeRule implements ScheduledSlaPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledSlaPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a scheduled sla plan. */
export class ScheduledSlaPlanValidator {
  rules: ScheduledSlaPlanRule[];

  constructor(rules: ScheduledSlaPlanRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledSlaPlan): string[] {
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

  requireValid(item: ScheduledSlaPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledSlaPlan[]): Map<string, string[]> {
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

export function defaultScheduledSlaPlanValidator(): ScheduledSlaPlanValidator {
  return new ScheduledSlaPlanValidator(
    [
      new ScheduledSlaPlanCodePrefixRule("ACM"),
      new ScheduledSlaPlanNameLengthRule(1000),
      new ScheduledSlaPlanCodeLengthRule(120),
      new ScheduledSlaPlanRequiredLocaleRule("scheduled sla plan needs an entry"),
      new ScheduledSlaPlanAllowedCodeRule([]),
    ],
  );
}
