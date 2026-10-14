/**
 * The subscription bundle records of consentcenter's subscription work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a subscription bundle is in its life cycle. */
export type SubscriptionBundleStatus = "created" | "validated" | "published" | "retired";

/** A subscription bundle. Its code is unique within a tenant. */
export class SubscriptionBundle {
  code: string;
  label: string;
  minimum: number;
  country: string;
  name: string;
  status: SubscriptionBundleStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    country: string,
    name: string,
    status: SubscriptionBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.country = country;
    this.name = name;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: SubscriptionBundleStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SubscriptionBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.minimum;
  }

  copy(): SubscriptionBundle {
    return new SubscriptionBundle(this.code, this.label, this.minimum, this.country, this.name, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a subscription bundle in status created. */
export function newSubscriptionBundle(code: string, label: string): SubscriptionBundle {
  return new SubscriptionBundle(code, label, 0, "", "", "created");
}
