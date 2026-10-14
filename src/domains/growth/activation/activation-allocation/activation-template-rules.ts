import * as text from "../../../../kit/text.js";
import { ActivationTemplate } from "./activation-template.js";

/** A rule a activation template must pass. Check returns its problems, or none. */
export interface ActivationTemplateRule {
  check(item: ActivationTemplate): string[];
}

export class ActivationTemplateRequiredCodeRule implements ActivationTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ActivationTemplateAllowedNotesRule implements ActivationTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ActivationTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.notes))) return [`notes ${item.notes} is too long`];
    return [];
  }
}

export class ActivationTemplateRequiredNotesRule implements ActivationTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ActivationTemplate): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a activation template. */
export class ActivationTemplateValidator {
  rules: ActivationTemplateRule[];

  constructor(rules: ActivationTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: ActivationTemplate): string[] {
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

  requireValid(item: ActivationTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ActivationTemplate[]): Map<string, string[]> {
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

export function defaultActivationTemplateValidator(): ActivationTemplateValidator {
  return new ActivationTemplateValidator(
    [
      new ActivationTemplateRequiredCodeRule("activation template needs this field"),
      new ActivationTemplateAllowedNotesRule(["scheduled", "strict"]),
      new ActivationTemplateRequiredNotesRule("activation template needs a value"),
    ],
  );
}
