/**
 * The credit request records of attribution's credit work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a credit request is in its life cycle. */
export type CreditRequestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A credit request as the credit team keeps it. */
export class CreditRequest {
  code: string;
  label: string;
  priority: number;
  attributes: Map<string, string>;
  active: boolean;
  source: string;
  journeyId: string;
  sendAt: number;
  score: number;
  frequencyCap: number;
  status: CreditRequestStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    attributes: Map<string, string>,
    active: boolean,
    source: string,
    journeyId: string,
    sendAt: number,
    score: number,
    frequencyCap: number,
    status: CreditRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.attributes = attributes;
    this.active = active;
    this.source = source;
    this.journeyId = journeyId;
    this.sendAt = sendAt;
    this.score = score;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: CreditRequestStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: CreditRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedExposure(): number {
    return Math.round((this.sendAt - this.priority) * 100) / 100;
  }

  copy(): CreditRequest {
    return new CreditRequest(
      this.code,
      this.label,
      this.priority,
      this.attributes,
      this.active,
      this.source,
      this.journeyId,
      this.sendAt,
      this.score,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a credit request in status proposed. */
export function newCreditRequest(code: string, label: string): CreditRequest {
  return new CreditRequest(code, label, 0, new Map<string, string>(), false, "", "", 0, 0, 0, "proposed");
}
