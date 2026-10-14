import { FallbackWindowAudit } from "./fallback-window-audit.js";

/** A rule a fallback window audit must pass. Check returns its problems, or none. */
export interface FallbackWindowAuditRule {
  check(item: FallbackWindowAudit): string[];
}

export class FallbackWindowAuditCodeLengthRule implements FallbackWindowAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackWindowAudit): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackWindowAuditChannelLengthRule implements FallbackWindowAuditRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackWindowAudit): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackWindowAuditRequiredCodeRule implements FallbackWindowAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackWindowAudit): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackWindowAuditRequiredChannelRule implements FallbackWindowAuditRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackWindowAudit): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback window audit. */
export class FallbackWindowAuditValidator {
  rules: FallbackWindowAuditRule[];

  constructor(rules: FallbackWindowAuditRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackWindowAudit): string[] {
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

  requireValid(item: FallbackWindowAudit): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackWindowAudit[]): Map<string, string[]> {
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

export function defaultFallbackWindowAuditValidator(): FallbackWindowAuditValidator {
  return new FallbackWindowAuditValidator(
    [
      new FallbackWindowAuditCodeLengthRule(86400),
      new FallbackWindowAuditChannelLengthRule(64),
      new FallbackWindowAuditRequiredCodeRule("fallback window audit needs a value"),
      new FallbackWindowAuditRequiredChannelRule("fallback window audit needs an entry"),
    ],
  );
}
