/**
 * The proof cycle records of consentcenter's proof work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a proof cycle is in its life cycle. */
export type ProofCycleStatus = "requested" | "granted" | "revoked" | "expired";

/** A proof cycle as the proof team keeps it. */
export class ProofCycle {
  code: string;
  title: string;
  contactEmail: string;
  tags: string[];
  ceiling: number;
  locale: string;
  rate: number;
  quantity: number;
  durationMinutes: number;
  sendAt: number;
  status: ProofCycleStatus;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    tags: string[],
    ceiling: number,
    locale: string,
    rate: number,
    quantity: number,
    durationMinutes: number,
    sendAt: number,
    status: ProofCycleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.tags = tags;
    this.ceiling = ceiling;
    this.locale = locale;
    this.rate = rate;
    this.quantity = quantity;
    this.durationMinutes = durationMinutes;
    this.sendAt = sendAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ProofCycleStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ProofCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedExposure(): number {
    return Math.round((this.rate + this.sendAt) * 100) / 100;
  }

  copy(): ProofCycle {
    return new ProofCycle(
      this.code,
      this.title,
      this.contactEmail,
      this.tags,
      this.ceiling,
      this.locale,
      this.rate,
      this.quantity,
      this.durationMinutes,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a proof cycle in status requested. */
export function newProofCycle(code: string, title: string): ProofCycle {
  return new ProofCycle(code, title, "", [], 0, "", 0, 0, 0, 0, "requested");
}
