import * as text from "../../../../kit/text.js";

/** Where a conversion rule is in its life cycle. */
export type ConversionRuleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A conversion rule. Its code is unique within a tenant. */
export class ConversionRule {
  code: string;
  name: string;
  maximum: number;
  revision: number;
  windowDays: number;
  externalRef: string;
  score: number;
  status: ConversionRuleStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    revision: number,
    windowDays: number,
    externalRef: string,
    score: number,
    status: ConversionRuleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.revision = revision;
    this.windowDays = windowDays;
    this.externalRef = externalRef;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ConversionRuleStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ConversionRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"conversion rule"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.maximum + this.score) * 100) / 100;
  }

  copy(): ConversionRule {
    return new ConversionRule(
      this.code,
      this.name,
      this.maximum,
      this.revision,
      this.windowDays,
      this.externalRef,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a conversion rule in status proposed. */
export function newConversionRule(code: string, name: string): ConversionRule {
  return new ConversionRule(code, name, 0, 0, 0, "", 0, "proposed");
}
