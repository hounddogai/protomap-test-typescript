import * as text from "../../../../kit/text.js";
import { SenderTemplate } from "./sender-template.js";

/** A rule a sender template must pass. Check returns its problems, or none. */
export interface SenderTemplateRule {
  check(item: SenderTemplate): string[];
}

export class SenderTemplateRequiredCodeRule implements SenderTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderTemplate): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SenderTemplateRequiredUtmSourceRule implements SenderTemplateRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SenderTemplate): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class SenderTemplateAllowedSegmentRule implements SenderTemplateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SenderTemplate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is inconsistent`];
    return [];
  }
}

export class SenderTemplateActiveGuardRule implements SenderTemplateRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SenderTemplate): string[] {
    if (item.active && item.cost > this.limit) return [`cost ${item.cost} exceeds ${this.limit} while active`];
    return [];
  }
}

/** Runs every rule of a sender template. */
export class SenderTemplateValidator {
  rules: SenderTemplateRule[];

  constructor(rules: SenderTemplateRule[]) {
    this.rules = rules;
  }

  validate(item: SenderTemplate): string[] {
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

  requireValid(item: SenderTemplate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SenderTemplate[]): Map<string, string[]> {
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

export function defaultSenderTemplateValidator(): SenderTemplateValidator {
  return new SenderTemplateValidator(
    [
      new SenderTemplateRequiredCodeRule("sender template needs an entry"),
      new SenderTemplateRequiredUtmSourceRule("sender template needs this field"),
      new SenderTemplateAllowedSegmentRule(["batched", "fallback", "pending"]),
      new SenderTemplateActiveGuardRule(2.4),
    ],
  );
}
