import { PrimaryQueueRule } from "./primary-queue-rule.js";

/** A rule a primary queue rule must pass. Check returns its problems, or none. */
export interface PrimaryQueueRuleRule {
  check(item: PrimaryQueueRule): string[];
}

export class PrimaryQueueRuleChannelLengthRule implements PrimaryQueueRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryQueueRule): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryQueueRuleRequiredCodeRule implements PrimaryQueueRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryQueueRule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryQueueRuleNameLengthRule implements PrimaryQueueRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryQueueRule): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryQueueRuleVariantLengthRule implements PrimaryQueueRuleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryQueueRule): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryQueueRuleRequiredVariantRule implements PrimaryQueueRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryQueueRule): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryQueueRuleRequiredNameRule implements PrimaryQueueRuleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryQueueRule): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary queue rule. */
export class PrimaryQueueRuleValidator {
  rules: PrimaryQueueRuleRule[];

  constructor(rules: PrimaryQueueRuleRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryQueueRule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryQueueRule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryQueueRule[]): Map<string, string[]> {
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

export function defaultPrimaryQueueRuleValidator(): PrimaryQueueRuleValidator {
  return new PrimaryQueueRuleValidator(
    [
      new PrimaryQueueRuleChannelLengthRule(255),
      new PrimaryQueueRuleRequiredCodeRule("primary queue rule needs this field"),
      new PrimaryQueueRuleNameLengthRule(86400),
      new PrimaryQueueRuleVariantLengthRule(32),
      new PrimaryQueueRuleRequiredVariantRule("primary queue rule needs a value"),
      new PrimaryQueueRuleRequiredNameRule("primary queue rule needs a value"),
    ],
  );
}
