import * as text from "../../../../kit/text.js";

/** Where a deflection agreement is in its life cycle. */
export type DeflectionAgreementStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a deflection agreement and its current status. */
export class DeflectionAgreement {
  code: string;
  name: string;
  channel: string;
  currency: string;
  batchSize: number;
  attributes: Map<string, string>;
  expiresAt: number;
  status: DeflectionAgreementStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    currency: string,
    batchSize: number,
    attributes: Map<string, string>,
    expiresAt: number,
    status: DeflectionAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.currency = currency;
    this.batchSize = batchSize;
    this.attributes = attributes;
    this.expiresAt = expiresAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: DeflectionAgreementStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: DeflectionAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"deflection agreement"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveValue(): number {
    return Math.round(this.batchSize * this.expiresAt * 100) / 100;
  }

  copy(): DeflectionAgreement {
    return new DeflectionAgreement(
      this.code,
      this.name,
      this.channel,
      this.currency,
      this.batchSize,
      this.attributes,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a deflection agreement in status planned. */
export function newDeflectionAgreement(code: string, name: string): DeflectionAgreement {
  return new DeflectionAgreement(code, name, "", "", 0, new Map<string, string>(), 0, "planned");
}
