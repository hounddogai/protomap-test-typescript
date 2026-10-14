import * as text from "../../../../kit/text.js";
import { TieredSenderTarget } from "./tiered-sender-target.js";

/** A rule a tiered sender target must pass. Check returns its problems, or none. */
export interface TieredSenderTargetRule {
  check(item: TieredSenderTarget): string[];
}

export class TieredSenderTargetRequiredOwnerIdRule implements TieredSenderTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredSenderTarget): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class TieredSenderTargetRequiredSourceRule implements TieredSenderTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredSenderTarget): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class TieredSenderTargetAllowedCodeRule implements TieredSenderTargetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: TieredSenderTarget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

export class TieredSenderTargetCodePrefixRule implements TieredSenderTargetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: TieredSenderTarget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class TieredSenderTargetRequiredCodeRule implements TieredSenderTargetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredSenderTarget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered sender target. */
export class TieredSenderTargetValidator {
  rules: TieredSenderTargetRule[];

  constructor(rules: TieredSenderTargetRule[]) {
    this.rules = rules;
  }

  validate(item: TieredSenderTarget): string[] {
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

  requireValid(item: TieredSenderTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredSenderTarget[]): Map<string, string[]> {
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

export function defaultTieredSenderTargetValidator(): TieredSenderTargetValidator {
  return new TieredSenderTargetValidator(
    [
      new TieredSenderTargetRequiredOwnerIdRule("tiered sender target needs a value"),
      new TieredSenderTargetRequiredSourceRule("tiered sender target needs a value"),
      new TieredSenderTargetAllowedCodeRule([]),
      new TieredSenderTargetCodePrefixRule("REF"),
      new TieredSenderTargetRequiredCodeRule("tiered sender target needs a value"),
    ],
  );
}
