import { StrictTicketViewManifest } from "./strict-ticket-view-manifest.js";

/** A rule a strict ticket view manifest must pass. Check returns its problems, or none. */
export interface StrictTicketViewManifestRule {
  check(item: StrictTicketViewManifest): string[];
}

export class StrictTicketViewManifestCodeLengthRule implements StrictTicketViewManifestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictTicketViewManifest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictTicketViewManifestApprovedGuardRule implements StrictTicketViewManifestRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: StrictTicketViewManifest): string[] {
    if (item.approved && item.amount > this.limit) return [`amount ${item.amount} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class StrictTicketViewManifestRequiredTitleRule implements StrictTicketViewManifestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictTicketViewManifest): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict ticket view manifest. */
export class StrictTicketViewManifestValidator {
  rules: StrictTicketViewManifestRule[];

  constructor(rules: StrictTicketViewManifestRule[]) {
    this.rules = rules;
  }

  validate(item: StrictTicketViewManifest): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictTicketViewManifest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictTicketViewManifest[]): Map<string, string[]> {
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

export function defaultStrictTicketViewManifestValidator(): StrictTicketViewManifestValidator {
  return new StrictTicketViewManifestValidator(
    [
      new StrictTicketViewManifestCodeLengthRule(32),
      new StrictTicketViewManifestApprovedGuardRule(1),
      new StrictTicketViewManifestRequiredTitleRule("strict ticket view manifest needs a value"),
    ],
  );
}
