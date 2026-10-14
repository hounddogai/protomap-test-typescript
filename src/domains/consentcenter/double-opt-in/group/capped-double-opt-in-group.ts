/**
 * The capped double opt in group records of consentcenter's double opt in work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped double opt in group is in its life cycle. */
export type CappedDoubleOptInGroupStatus = "requested" | "granted" | "revoked" | "expired";

/** A capped double opt in group. Its code is unique within a tenant. */
export class CappedDoubleOptInGroup {
  code: string;
  label: string;
  amount: number;
  externalRef: string;
  channel: string;
  attributes: Map<string, string>;
  threshold: number;
  approved: boolean;
  status: CappedDoubleOptInGroupStatus;

  constructor(
    code: string,
    label: string,
    amount: number,
    externalRef: string,
    channel: string,
    attributes: Map<string, string>,
    threshold: number,
    approved: boolean,
    status: CappedDoubleOptInGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.externalRef = externalRef;
    this.channel = channel;
    this.attributes = attributes;
    this.threshold = threshold;
    this.approved = approved;
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

  canMoveTo(next: CappedDoubleOptInGroupStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedDoubleOptInGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped double opt in group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveLoad(): number {
    return Math.round((this.amount - this.threshold) * 100) / 100;
  }

  copy(): CappedDoubleOptInGroup {
    return new CappedDoubleOptInGroup(
      this.code,
      this.label,
      this.amount,
      this.externalRef,
      this.channel,
      this.attributes,
      this.threshold,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a capped double opt in group in status requested. */
export function newCappedDoubleOptInGroup(code: string, label: string): CappedDoubleOptInGroup {
  return new CappedDoubleOptInGroup(code, label, 0, "", "", new Map<string, string>(), 0, false, "requested");
}
