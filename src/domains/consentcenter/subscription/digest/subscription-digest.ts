/**
 * The subscription digest records of consentcenter's subscription work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a subscription digest is in its life cycle. */
export type SubscriptionDigestStatus = "requested" | "granted" | "revoked" | "expired";

/** A subscription digest. Its code is unique within a tenant. */
export class SubscriptionDigest {
  code: string;
  name: string;
  weight: number;
  source: string;
  capacity: number;
  status: SubscriptionDigestStatus;

  constructor(
    code: string,
    name: string,
    weight: number,
    source: string,
    capacity: number,
    status: SubscriptionDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.weight = weight;
    this.source = source;
    this.capacity = capacity;
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

  canMoveTo(next: SubscriptionDigestStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: SubscriptionDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedVolume(): number {
    return Math.round((this.weight + this.capacity) * 100) / 100;
  }

  copy(): SubscriptionDigest {
    return new SubscriptionDigest(this.code, this.name, this.weight, this.source, this.capacity, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a subscription digest in status requested. */
export function newSubscriptionDigest(code: string, name: string): SubscriptionDigest {
  return new SubscriptionDigest(code, name, 0, "", 0, "requested");
}
