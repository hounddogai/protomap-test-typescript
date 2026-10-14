import * as text from "../../../../kit/text.js";
import { SeasonalDoubleOptInSlot } from "./seasonal-double-opt-in-slot.js";

/** A rule a seasonal double opt in slot must pass. Check returns its problems, or none. */
export interface SeasonalDoubleOptInSlotRule {
  check(item: SeasonalDoubleOptInSlot): string[];
}

export class SeasonalDoubleOptInSlotAllowedNameRule implements SeasonalDoubleOptInSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalDoubleOptInSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is out of range`];
    return [];
  }
}

export class SeasonalDoubleOptInSlotRequiredNameRule implements SeasonalDoubleOptInSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalDoubleOptInSlot): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalDoubleOptInSlotCodePrefixRule implements SeasonalDoubleOptInSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SeasonalDoubleOptInSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a seasonal double opt in slot. */
export class SeasonalDoubleOptInSlotValidator {
  rules: SeasonalDoubleOptInSlotRule[];

  constructor(rules: SeasonalDoubleOptInSlotRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalDoubleOptInSlot): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalDoubleOptInSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalDoubleOptInSlot[]): Map<string, string[]> {
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

export function defaultSeasonalDoubleOptInSlotValidator(): SeasonalDoubleOptInSlotValidator {
  return new SeasonalDoubleOptInSlotValidator(
    [
      new SeasonalDoubleOptInSlotAllowedNameRule(["capped", "strict"]),
      new SeasonalDoubleOptInSlotRequiredNameRule("seasonal double opt in slot needs this field"),
      new SeasonalDoubleOptInSlotCodePrefixRule("OPS"),
    ],
  );
}
