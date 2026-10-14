import { CappedCreditCheckpoint } from "./capped-credit-checkpoint.js";

/** A rule a capped credit checkpoint must pass. Check returns its problems, or none. */
export interface CappedCreditCheckpointRule {
  check(item: CappedCreditCheckpoint): string[];
}

export class CappedCreditCheckpointRequiredCodeRule implements CappedCreditCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedCreditCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedCreditCheckpointCodeLengthRule implements CappedCreditCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedCreditCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedCreditCheckpointNameLengthRule implements CappedCreditCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedCreditCheckpoint): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedCreditCheckpointApprovedGuardRule implements CappedCreditCheckpointRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: CappedCreditCheckpoint): string[] {
    if (item.approved && item.minimum > this.limit) return [`minimum ${item.minimum} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class CappedCreditCheckpointRequiredNameRule implements CappedCreditCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedCreditCheckpoint): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CappedCreditCheckpointCodePrefixRule implements CappedCreditCheckpointRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CappedCreditCheckpoint): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a capped credit checkpoint. */
export class CappedCreditCheckpointValidator {
  rules: CappedCreditCheckpointRule[];

  constructor(rules: CappedCreditCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: CappedCreditCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedCreditCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedCreditCheckpoint[]): Map<string, string[]> {
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

export function defaultCappedCreditCheckpointValidator(): CappedCreditCheckpointValidator {
  return new CappedCreditCheckpointValidator(
    [
      new CappedCreditCheckpointRequiredCodeRule("capped credit checkpoint needs this field"),
      new CappedCreditCheckpointCodeLengthRule(3600),
      new CappedCreditCheckpointNameLengthRule(32),
      new CappedCreditCheckpointApprovedGuardRule(4.8),
      new CappedCreditCheckpointRequiredNameRule("capped credit checkpoint needs a value"),
      new CappedCreditCheckpointCodePrefixRule("REF"),
    ],
  );
}
