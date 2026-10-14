import { GlobalDomainThreshold } from "./global-domain-threshold.js";

/** A rule a global domain threshold must pass. Check returns its problems, or none. */
export interface GlobalDomainThresholdRule {
  check(item: GlobalDomainThreshold): string[];
}

export class GlobalDomainThresholdPhoneLengthRule implements GlobalDomainThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalDomainThreshold): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalDomainThresholdJourneyIdLengthRule implements GlobalDomainThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalDomainThreshold): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalDomainThresholdCodeLengthRule implements GlobalDomainThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalDomainThreshold): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalDomainThresholdRequiredNameRule implements GlobalDomainThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalDomainThreshold): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalDomainThresholdRequiredJourneyIdRule implements GlobalDomainThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalDomainThreshold): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalDomainThresholdNameLengthRule implements GlobalDomainThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalDomainThreshold): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global domain threshold. */
export class GlobalDomainThresholdValidator {
  rules: GlobalDomainThresholdRule[];

  constructor(rules: GlobalDomainThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalDomainThreshold): string[] {
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

  requireValid(item: GlobalDomainThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalDomainThreshold[]): Map<string, string[]> {
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

export function defaultGlobalDomainThresholdValidator(): GlobalDomainThresholdValidator {
  return new GlobalDomainThresholdValidator(
    [
      new GlobalDomainThresholdPhoneLengthRule(255),
      new GlobalDomainThresholdJourneyIdLengthRule(32),
      new GlobalDomainThresholdCodeLengthRule(64),
      new GlobalDomainThresholdRequiredNameRule("global domain threshold needs this field"),
      new GlobalDomainThresholdRequiredJourneyIdRule("global domain threshold needs this field"),
      new GlobalDomainThresholdNameLengthRule(16),
    ],
  );
}
