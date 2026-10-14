import * as text from "../../../../kit/text.js";
import { DefaultRewardRuleWindow } from "./default-reward-rule-window.js";

/** A rule a default reward rule window must pass. Check returns its problems, or none. */
export interface DefaultRewardRuleWindowRule {
  check(item: DefaultRewardRuleWindow): string[];
}

export class DefaultRewardRuleWindowAllowedTitleRule implements DefaultRewardRuleWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DefaultRewardRuleWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is inconsistent`];
    return [];
  }
}

export class DefaultRewardRuleWindowCodeLengthRule implements DefaultRewardRuleWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultRewardRuleWindow): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultRewardRuleWindowRequiredTitleRule implements DefaultRewardRuleWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultRewardRuleWindow): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultRewardRuleWindowPinnedGuardRule implements DefaultRewardRuleWindowRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: DefaultRewardRuleWindow): string[] {
    if (item.pinned && item.maximum > this.limit) return [`maximum ${item.maximum} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class DefaultRewardRuleWindowCodePrefixRule implements DefaultRewardRuleWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultRewardRuleWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a default reward rule window. */
export class DefaultRewardRuleWindowValidator {
  rules: DefaultRewardRuleWindowRule[];

  constructor(rules: DefaultRewardRuleWindowRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultRewardRuleWindow): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultRewardRuleWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultRewardRuleWindow[]): Map<string, string[]> {
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

export function defaultDefaultRewardRuleWindowValidator(): DefaultRewardRuleWindowValidator {
  return new DefaultRewardRuleWindowValidator(
    [
      new DefaultRewardRuleWindowAllowedTitleRule([]),
      new DefaultRewardRuleWindowCodeLengthRule(1000),
      new DefaultRewardRuleWindowRequiredTitleRule("default reward rule window needs an entry"),
      new DefaultRewardRuleWindowPinnedGuardRule(5.9),
      new DefaultRewardRuleWindowCodePrefixRule("ACM"),
    ],
  );
}
