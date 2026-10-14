import * as text from "../../../../kit/text.js";
import { CappedFlightGroup } from "./capped-flight-group.js";

/** A rule a capped flight group must pass. Check returns its problems, or none. */
export interface CappedFlightGroupRule {
  check(item: CappedFlightGroup): string[];
}

export class CappedFlightGroupCodeLengthRule implements CappedFlightGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedFlightGroup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedFlightGroupAllowedTitleRule implements CappedFlightGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedFlightGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is above maximum`];
    return [];
  }
}

export class CappedFlightGroupRequiredCodeRule implements CappedFlightGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedFlightGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedFlightGroupRequiredTitleRule implements CappedFlightGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedFlightGroup): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped flight group. */
export class CappedFlightGroupValidator {
  rules: CappedFlightGroupRule[];

  constructor(rules: CappedFlightGroupRule[]) {
    this.rules = rules;
  }

  validate(item: CappedFlightGroup): string[] {
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

  requireValid(item: CappedFlightGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedFlightGroup[]): Map<string, string[]> {
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

export function defaultCappedFlightGroupValidator(): CappedFlightGroupValidator {
  return new CappedFlightGroupValidator(
    [
      new CappedFlightGroupCodeLengthRule(16),
      new CappedFlightGroupAllowedTitleRule(["batched"]),
      new CappedFlightGroupRequiredCodeRule("capped flight group needs an entry"),
      new CappedFlightGroupRequiredTitleRule("capped flight group needs an entry"),
    ],
  );
}
