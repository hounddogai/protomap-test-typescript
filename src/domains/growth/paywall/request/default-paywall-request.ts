/**
 * The default paywall request records of growth's paywall work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default paywall request is in its life cycle. */
export type DefaultPaywallRequestStatus = "requested" | "granted" | "revoked" | "expired";

/** A default paywall request. Its code is unique within a tenant. */
export class DefaultPaywallRequest {
  code: string;
  name: string;
  source: string;
  externalRef: string;
  frequencyCap: number;
  budget: number;
  margin: number;
  visible: boolean;
  status: DefaultPaywallRequestStatus;

  constructor(
    code: string,
    name: string,
    source: string,
    externalRef: string,
    frequencyCap: number,
    budget: number,
    margin: number,
    visible: boolean,
    status: DefaultPaywallRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.source = source;
    this.externalRef = externalRef;
    this.frequencyCap = frequencyCap;
    this.budget = budget;
    this.margin = margin;
    this.visible = visible;
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

  canMoveTo(next: DefaultPaywallRequestStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: DefaultPaywallRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default paywall request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedVolume(): number {
    return Math.round((this.budget - this.margin) * 100) / 100;
  }

  copy(): DefaultPaywallRequest {
    return new DefaultPaywallRequest(
      this.code,
      this.name,
      this.source,
      this.externalRef,
      this.frequencyCap,
      this.budget,
      this.margin,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a default paywall request in status requested. */
export function newDefaultPaywallRequest(code: string, name: string): DefaultPaywallRequest {
  return new DefaultPaywallRequest(code, name, "", "", 0, 0, 0, false, "requested");
}
