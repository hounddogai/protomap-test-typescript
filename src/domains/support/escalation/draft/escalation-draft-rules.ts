import * as text from "../../../../kit/text.js";
import { EscalationDraft } from "./escalation-draft.js";

/** A rule a escalation draft must pass. Check returns its problems, or none. */
export interface EscalationDraftRule {
  check(item: EscalationDraft): string[];
}

export class EscalationDraftRequiredLabelRule implements EscalationDraftRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationDraft): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationDraftAllowedNameRule implements EscalationDraftRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: EscalationDraft): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is blocked`];
    return [];
  }
}

export class EscalationDraftCodePrefixRule implements EscalationDraftRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EscalationDraft): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class EscalationDraftMarginRangeRule implements EscalationDraftRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationDraft): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EscalationDraftNameLengthRule implements EscalationDraftRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationDraft): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a escalation draft. */
export class EscalationDraftValidator {
  rules: EscalationDraftRule[];

  constructor(rules: EscalationDraftRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationDraft): string[] {
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

  requireValid(item: EscalationDraft): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationDraft[]): Map<string, string[]> {
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

export function defaultEscalationDraftValidator(): EscalationDraftValidator {
  return new EscalationDraftValidator(
    [
      new EscalationDraftRequiredLabelRule("escalation draft needs an entry"),
      new EscalationDraftAllowedNameRule(["fallback", "tiered", "primary"]),
      new EscalationDraftCodePrefixRule("X"),
      new EscalationDraftMarginRangeRule(4.4, 4590),
      new EscalationDraftNameLengthRule(86400),
    ],
  );
}
