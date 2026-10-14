import { MacroAudit } from "./macro-audit.js";

/** A rule a macro audit must pass. Check returns its problems, or none. */
export interface MacroAuditRule {
  check(item: MacroAudit): string[];
}

export class MacroAuditChannelLengthRule implements MacroAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: MacroAudit): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class MacroAuditArchivedGuardRule implements MacroAuditRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: MacroAudit): string[] {
    if (item.archived && item.conversionRate > this.limit) return [`conversion rate ${item.conversionRate} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class MacroAuditCodePrefixRule implements MacroAuditRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: MacroAudit): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class MacroAuditRequiredChannelRule implements MacroAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: MacroAudit): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a macro audit. */
export class MacroAuditValidator {
  rules: MacroAuditRule[];

  constructor(rules: MacroAuditRule[]) {
    this.rules = rules;
  }

  validate(item: MacroAudit): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: MacroAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: MacroAudit[]): Map<string, string[]> {
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

export function defaultMacroAuditValidator(): MacroAuditValidator {
  return new MacroAuditValidator(
    [
      new MacroAuditChannelLengthRule(64),
      new MacroAuditArchivedGuardRule(9.9),
      new MacroAuditCodePrefixRule("OPS"),
      new MacroAuditRequiredChannelRule("macro audit needs an entry"),
    ],
  );
}
