import { StrictTicketViewBatch } from "./strict-ticket-view-batch.js";

/** A rule a strict ticket view batch must pass. Check returns its problems, or none. */
export interface StrictTicketViewBatchRule {
  check(item: StrictTicketViewBatch): string[];
}

export class StrictTicketViewBatchRequiredNameRule implements StrictTicketViewBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictTicketViewBatch): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class StrictTicketViewBatchOwnerIdLengthRule implements StrictTicketViewBatchRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictTicketViewBatch): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictTicketViewBatchRequiredOwnerIdRule implements StrictTicketViewBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictTicketViewBatch): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class StrictTicketViewBatchRequiredExternalRefRule implements StrictTicketViewBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictTicketViewBatch): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class StrictTicketViewBatchRequiredCodeRule implements StrictTicketViewBatchRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictTicketViewBatch): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class StrictTicketViewBatchCodePrefixRule implements StrictTicketViewBatchRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictTicketViewBatch): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a strict ticket view batch. */
export class StrictTicketViewBatchValidator {
  rules: StrictTicketViewBatchRule[];

  constructor(rules: StrictTicketViewBatchRule[]) {
    this.rules = rules;
  }

  validate(item: StrictTicketViewBatch): string[] {
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

  requireValid(item: StrictTicketViewBatch): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictTicketViewBatch[]): Map<string, string[]> {
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

export function defaultStrictTicketViewBatchValidator(): StrictTicketViewBatchValidator {
  return new StrictTicketViewBatchValidator(
    [
      new StrictTicketViewBatchRequiredNameRule("strict ticket view batch needs a value"),
      new StrictTicketViewBatchOwnerIdLengthRule(32),
      new StrictTicketViewBatchRequiredOwnerIdRule("strict ticket view batch needs an entry"),
      new StrictTicketViewBatchRequiredExternalRefRule("strict ticket view batch needs this field"),
      new StrictTicketViewBatchRequiredCodeRule("strict ticket view batch needs a value"),
      new StrictTicketViewBatchCodePrefixRule("REF"),
    ],
  );
}
