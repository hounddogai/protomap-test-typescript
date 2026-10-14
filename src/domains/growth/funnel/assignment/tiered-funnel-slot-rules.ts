import * as text from "../../../../kit/text.js";
import { TieredFunnelSlot } from "./tiered-funnel-slot.js";

/** A rule a tiered funnel slot must pass. Check returns its problems, or none. */
export interface TieredFunnelSlotRule {
  check(item: TieredFunnelSlot): string[];
}

export class TieredFunnelSlotCodePrefixRule implements TieredFunnelSlotRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredFunnelSlot): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredFunnelSlotCodeLengthRule implements TieredFunnelSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredFunnelSlot): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredFunnelSlotAllowedUnitRule implements TieredFunnelSlotRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredFunnelSlot): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.unit))) return [`unit ${item.unit} is stale`];
    return [];
  }
}

export class TieredFunnelSlotTitleLengthRule implements TieredFunnelSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredFunnelSlot): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredFunnelSlotUnitLengthRule implements TieredFunnelSlotRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredFunnelSlot): string[] {
    const size = item.unit.length;
    if (size > this.maxLength) return [`unit is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a tiered funnel slot. */
export class TieredFunnelSlotValidator {
  rules: TieredFunnelSlotRule[];

  constructor(rules: TieredFunnelSlotRule[]) {
    this.rules = rules;
  }

  validate(item: TieredFunnelSlot): string[] {
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

  requireValid(item: TieredFunnelSlot): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredFunnelSlot[]): Map<string, string[]> {
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

export function defaultTieredFunnelSlotValidator(): TieredFunnelSlotValidator {
  return new TieredFunnelSlotValidator(
    [
      new TieredFunnelSlotCodePrefixRule("REF"),
      new TieredFunnelSlotCodeLengthRule(64),
      new TieredFunnelSlotAllowedUnitRule(["capped", "legacy", "seasonal"]),
      new TieredFunnelSlotTitleLengthRule(80),
      new TieredFunnelSlotUnitLengthRule(86400),
    ],
  );
}
