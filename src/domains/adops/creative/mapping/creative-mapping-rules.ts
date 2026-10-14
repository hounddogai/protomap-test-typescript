import * as text from "../../../../kit/text.js";
import { CreativeMapping } from "./creative-mapping.js";

/** A rule a creative mapping must pass. Check returns its problems, or none. */
export interface CreativeMappingRule {
  check(item: CreativeMapping): string[];
}

export class CreativeMappingRequiredCodeRule implements CreativeMappingRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreativeMapping): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CreativeMappingCodePrefixRule implements CreativeMappingRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreativeMapping): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CreativeMappingAudienceIdLengthRule implements CreativeMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeMapping): string[] {
    const size = item.audienceId.length;
    if (size > this.maxLength) return [`audience id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreativeMappingAllowedCodeRule implements CreativeMappingRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreativeMapping): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class CreativeMappingNameLengthRule implements CreativeMappingRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreativeMapping): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a creative mapping. */
export class CreativeMappingValidator {
  rules: CreativeMappingRule[];

  constructor(rules: CreativeMappingRule[]) {
    this.rules = rules;
  }

  validate(item: CreativeMapping): string[] {
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

  requireValid(item: CreativeMapping): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreativeMapping[]): Map<string, string[]> {
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

export function defaultCreativeMappingValidator(): CreativeMappingValidator {
  return new CreativeMappingValidator(
    [
      new CreativeMappingRequiredCodeRule("creative mapping needs a value"),
      new CreativeMappingCodePrefixRule("OPS"),
      new CreativeMappingAudienceIdLengthRule(1000),
      new CreativeMappingAllowedCodeRule(["global"]),
      new CreativeMappingNameLengthRule(3600),
    ],
  );
}
