import * as text from "../../../../kit/text.js";
import { CsatSlot } from "./csat-slot.js";

/** A rule a csat slot must pass. Check returns its problems, or none. */
export interface CsatSlotRule {
  check(item: CsatSlot): string[];
}

export class CsatSlotCodePrefixRule implements CsatSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CsatSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CsatSlotOpenRateRangeRule implements CsatSlotRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CsatSlot): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CsatSlotAllowedNameRule implements CsatSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CsatSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is missing`];
    return [];
  }
}

export class CsatSlotRequiredChecksumRule implements CsatSlotRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CsatSlot): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class CsatSlotNameLengthRule implements CsatSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CsatSlot): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a csat slot. */
export class CsatSlotValidator {
  rules: CsatSlotRule[];

  constructor(rules: CsatSlotRule[]) {
    this.rules = rules;
  }

  validate(item: CsatSlot): string[] {
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

  requireValid(item: CsatSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CsatSlot[]): Map<string, string[]> {
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

export function defaultCsatSlotValidator(): CsatSlotValidator {
  return new CsatSlotValidator(
    [
      new CsatSlotCodePrefixRule("ACM"),
      new CsatSlotOpenRateRangeRule(1.6, 4182.4),
      new CsatSlotAllowedNameRule([]),
      new CsatSlotRequiredChecksumRule("csat slot needs this field"),
      new CsatSlotNameLengthRule(80),
    ],
  );
}
