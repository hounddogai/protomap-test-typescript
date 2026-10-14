/**
 * The proof window records of consentcenter's proof work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a proof window is in its life cycle. */
export type ProofWindowStatus = "requested" | "granted" | "revoked" | "expired";

/** A proof window. Its code is unique within a tenant. */
export class ProofWindow {
  code: string;
  name: string;
  updatedAt: number;
  category: string;
  retries: number;
  cost: number;
  active: boolean;
  region: string;
  externalRef: string;
  createdAt: number;
  status: ProofWindowStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    category: string,
    retries: number,
    cost: number,
    active: boolean,
    region: string,
    externalRef: string,
    createdAt: number,
    status: ProofWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.category = category;
    this.retries = retries;
    this.cost = cost;
    this.active = active;
    this.region = region;
    this.externalRef = externalRef;
    this.createdAt = createdAt;
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

  canMoveTo(next: ProofWindowStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ProofWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"proof window"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round(this.retries * this.cost * 100) / 100;
  }

  copy(): ProofWindow {
    return new ProofWindow(
      this.code,
      this.name,
      this.updatedAt,
      this.category,
      this.retries,
      this.cost,
      this.active,
      this.region,
      this.externalRef,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a proof window in status requested. */
export function newProofWindow(code: string, name: string): ProofWindow {
  return new ProofWindow(code, name, 0, "", 0, 0, false, "", "", 0, "requested");
}
