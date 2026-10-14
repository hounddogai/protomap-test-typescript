import * as text from "../../../../kit/text.js";
import { CappedTicketViewThreshold } from "./capped-ticket-view-threshold.js";

/** A rule a capped ticket view threshold must pass. Check returns its problems, or none. */
export interface CappedTicketViewThresholdRule {
  check(item: CappedTicketViewThreshold): string[];
}

export class CappedTicketViewThresholdRequiredLabelRule implements CappedTicketViewThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedTicketViewThreshold): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class CappedTicketViewThresholdFrequencyCapRangeRule implements CappedTicketViewThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedTicketViewThreshold): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedTicketViewThresholdAllowedCodeRule implements CappedTicketViewThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedTicketViewThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

export class CappedTicketViewThresholdRequiredCodeRule implements CappedTicketViewThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedTicketViewThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped ticket view threshold. */
export class CappedTicketViewThresholdValidator {
  rules: CappedTicketViewThresholdRule[];

  constructor(rules: CappedTicketViewThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: CappedTicketViewThreshold): string[] {
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

  requireValid(item: CappedTicketViewThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedTicketViewThreshold[]): Map<string, string[]> {
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

export function defaultCappedTicketViewThresholdValidator(): CappedTicketViewThresholdValidator {
  return new CappedTicketViewThresholdValidator(
    [
      new CappedTicketViewThresholdRequiredLabelRule("capped ticket view threshold needs a value"),
      new CappedTicketViewThresholdFrequencyCapRangeRule(1000, 86400),
      new CappedTicketViewThresholdAllowedCodeRule(["global"]),
      new CappedTicketViewThresholdRequiredCodeRule("capped ticket view threshold needs a value"),
    ],
  );
}
