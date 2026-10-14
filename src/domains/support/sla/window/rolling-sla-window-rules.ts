import * as text from "../../../../kit/text.js";
import { RollingSlaWindow } from "./rolling-sla-window.js";

/** A rule a rolling sla window must pass. Check returns its problems, or none. */
export interface RollingSlaWindowRule {
  check(item: RollingSlaWindow): string[];
}

export class RollingSlaWindowRequiredLabelRule implements RollingSlaWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingSlaWindow): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RollingSlaWindowRequiredNameRule implements RollingSlaWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingSlaWindow): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RollingSlaWindowAllowedAudienceIdRule implements RollingSlaWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingSlaWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.audienceId))) return [`audience id ${item.audienceId} is missing`];
    return [];
  }
}

/** Runs every rule of a rolling sla window. */
export class RollingSlaWindowValidator {
  rules: RollingSlaWindowRule[];

  constructor(rules: RollingSlaWindowRule[]) {
    this.rules = rules;
  }

  validate(item: RollingSlaWindow): string[] {
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

  requireValid(item: RollingSlaWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingSlaWindow[]): Map<string, string[]> {
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

export function defaultRollingSlaWindowValidator(): RollingSlaWindowValidator {
  return new RollingSlaWindowValidator(
    [
      new RollingSlaWindowRequiredLabelRule("rolling sla window needs a value"),
      new RollingSlaWindowRequiredNameRule("rolling sla window needs this field"),
      new RollingSlaWindowAllowedAudienceIdRule(["manual"]),
    ],
  );
}
