/**
 * The subscription request records of consentcenter's subscription work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a subscription request is in its life cycle. */
export type SubscriptionRequestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A subscription request as the subscription team keeps it. */
export class SubscriptionRequest {
  code: string;
  title: string;
  label: string;
  locale: string;
  region: string;
  floorValue: number;
  expiresAt: number;
  margin: number;
  frequencyCap: number;
  weight: number;
  cost: number;
  status: SubscriptionRequestStatus;

  constructor(
    code: string,
    title: string,
    label: string,
    locale: string,
    region: string,
    floorValue: number,
    expiresAt: number,
    margin: number,
    frequencyCap: number,
    weight: number,
    cost: number,
    status: SubscriptionRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.label = label;
    this.locale = locale;
    this.region = region;
    this.floorValue = floorValue;
    this.expiresAt = expiresAt;
    this.margin = margin;
    this.frequencyCap = frequencyCap;
    this.weight = weight;
    this.cost = cost;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: SubscriptionRequestStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SubscriptionRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`subscription request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedLoad(): number {
    return Math.round(this.frequencyCap * this.weight * 100) / 100;
  }

  copy(): SubscriptionRequest {
    return new SubscriptionRequest(
      this.code,
      this.title,
      this.label,
      this.locale,
      this.region,
      this.floorValue,
      this.expiresAt,
      this.margin,
      this.frequencyCap,
      this.weight,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a subscription request in status draft. */
export function newSubscriptionRequest(code: string, title: string): SubscriptionRequest {
  return new SubscriptionRequest(code, title, "", "", "", 0, 0, 0, 0, 0, 0, "draft");
}
