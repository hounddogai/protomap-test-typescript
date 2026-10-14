import { PrimaryTicketViewCheckpoint } from "./primary-ticket-view-checkpoint.js";

/** A rule a primary ticket view checkpoint must pass. Check returns its problems, or none. */
export interface PrimaryTicketViewCheckpointRule {
  check(item: PrimaryTicketViewCheckpoint): string[];
}

export class PrimaryTicketViewCheckpointCodeLengthRule implements PrimaryTicketViewCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryTicketViewCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryTicketViewCheckpointRequiredRegionRule implements PrimaryTicketViewCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryTicketViewCheckpoint): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryTicketViewCheckpointCodePrefixRule implements PrimaryTicketViewCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryTicketViewCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimaryTicketViewCheckpointRequiredTitleRule implements PrimaryTicketViewCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryTicketViewCheckpoint): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryTicketViewCheckpointRequiredExternalRefRule implements PrimaryTicketViewCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryTicketViewCheckpoint): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryTicketViewCheckpointRequiredCodeRule implements PrimaryTicketViewCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryTicketViewCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary ticket view checkpoint. */
export class PrimaryTicketViewCheckpointValidator {
  rules: PrimaryTicketViewCheckpointRule[];

  constructor(rules: PrimaryTicketViewCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryTicketViewCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryTicketViewCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryTicketViewCheckpoint[]): Map<string, string[]> {
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

export function defaultPrimaryTicketViewCheckpointValidator(): PrimaryTicketViewCheckpointValidator {
  return new PrimaryTicketViewCheckpointValidator(
    [
      new PrimaryTicketViewCheckpointCodeLengthRule(86400),
      new PrimaryTicketViewCheckpointRequiredRegionRule("primary ticket view checkpoint needs this field"),
      new PrimaryTicketViewCheckpointCodePrefixRule("OPS"),
      new PrimaryTicketViewCheckpointRequiredTitleRule("primary ticket view checkpoint needs an entry"),
      new PrimaryTicketViewCheckpointRequiredExternalRefRule("primary ticket view checkpoint needs an entry"),
      new PrimaryTicketViewCheckpointRequiredCodeRule("primary ticket view checkpoint needs a value"),
    ],
  );
}
