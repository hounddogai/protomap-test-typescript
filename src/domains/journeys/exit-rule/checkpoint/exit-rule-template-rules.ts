import * as text from "../../../../kit/text.js";
import { ExitRuleTemplate } from "./exit-rule-template.js";

/** A rule a exit rule template must pass. Check returns its problems, or none. */
export interface ExitRuleTemplateRule {
  check(item: ExitRuleTemplate): string[];
}

export class ExitRuleTemplateRequiredJourneyIdRule implements ExitRuleTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleTemplate): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleTemplateRequiredNameRule implements ExitRuleTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ExitRuleTemplate): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class ExitRuleTemplateCodePrefixRule implements ExitRuleTemplateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ExitRuleTemplate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ExitRuleTemplateAllowedNameRule implements ExitRuleTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ExitRuleTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is blocked`];
    return [];
  }
}

export class ExitRuleTemplateJourneyIdLengthRule implements ExitRuleTemplateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleTemplate): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a exit rule template. */
export class ExitRuleTemplateValidator {
  rules: ExitRuleTemplateRule[];

  constructor(rules: ExitRuleTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleTemplate): string[] {
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

  requireValid(item: ExitRuleTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleTemplate[]): Map<string, string[]> {
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

export function defaultExitRuleTemplateValidator(): ExitRuleTemplateValidator {
  return new ExitRuleTemplateValidator(
    [
      new ExitRuleTemplateRequiredJourneyIdRule("exit rule template needs a value"),
      new ExitRuleTemplateRequiredNameRule("exit rule template needs an entry"),
      new ExitRuleTemplateCodePrefixRule("OPS"),
      new ExitRuleTemplateAllowedNameRule(["capped", "capped", "fallback"]),
      new ExitRuleTemplateJourneyIdLengthRule(120),
    ],
  );
}
