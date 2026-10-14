import * as text from "../../../../kit/text.js";
import { ScheduledPathTemplate } from "./scheduled-path-template.js";

/** A rule a scheduled path template must pass. Check returns its problems, or none. */
export interface ScheduledPathTemplateRule {
  check(item: ScheduledPathTemplate): string[];
}

export class ScheduledPathTemplateRequiredCodeRule implements ScheduledPathTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledPathTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledPathTemplateAllowedNameRule implements ScheduledPathTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledPathTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is missing`];
    return [];
  }
}

export class ScheduledPathTemplateCodePrefixRule implements ScheduledPathTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledPathTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a scheduled path template. */
export class ScheduledPathTemplateValidator {
  rules: ScheduledPathTemplateRule[];

  constructor(rules: ScheduledPathTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledPathTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledPathTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledPathTemplate[]): Map<string, string[]> {
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

export function defaultScheduledPathTemplateValidator(): ScheduledPathTemplateValidator {
  return new ScheduledPathTemplateValidator(
    [
      new ScheduledPathTemplateRequiredCodeRule("scheduled path template needs a value"),
      new ScheduledPathTemplateAllowedNameRule(["weighted"]),
      new ScheduledPathTemplateCodePrefixRule("ACM"),
    ],
  );
}
