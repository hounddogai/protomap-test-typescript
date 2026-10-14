import * as text from "../../../../kit/text.js";
import { ScheduledMacroTemplate } from "./scheduled-macro-template.js";

/** A rule a scheduled macro template must pass. Check returns its problems, or none. */
export interface ScheduledMacroTemplateRule {
  check(item: ScheduledMacroTemplate): string[];
}

export class ScheduledMacroTemplateCodePrefixRule implements ScheduledMacroTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ScheduledMacroTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ScheduledMacroTemplateRequiredCodeRule implements ScheduledMacroTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledMacroTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledMacroTemplateAllowedJourneyIdRule implements ScheduledMacroTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ScheduledMacroTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.journeyId))) return [`journey id ${item.journeyId} is out of range`];
    return [];
  }
}

export class ScheduledMacroTemplateJourneyIdLengthRule implements ScheduledMacroTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledMacroTemplate): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledMacroTemplateNameLengthRule implements ScheduledMacroTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledMacroTemplate): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledMacroTemplateCodeLengthRule implements ScheduledMacroTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledMacroTemplate): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a scheduled macro template. */
export class ScheduledMacroTemplateValidator {
  rules: ScheduledMacroTemplateRule[];

  constructor(rules: ScheduledMacroTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledMacroTemplate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledMacroTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledMacroTemplate[]): Map<string, string[]> {
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

export function defaultScheduledMacroTemplateValidator(): ScheduledMacroTemplateValidator {
  return new ScheduledMacroTemplateValidator(
    [
      new ScheduledMacroTemplateCodePrefixRule("OPS"),
      new ScheduledMacroTemplateRequiredCodeRule("scheduled macro template needs this field"),
      new ScheduledMacroTemplateAllowedJourneyIdRule(["regional", "seasonal", "rolling"]),
      new ScheduledMacroTemplateJourneyIdLengthRule(32),
      new ScheduledMacroTemplateNameLengthRule(16),
      new ScheduledMacroTemplateCodeLengthRule(255),
    ],
  );
}
