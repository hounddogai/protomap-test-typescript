/**
 * The bounce draft records of deliverability's bounce work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a bounce draft is in its life cycle. */
export type BounceDraftStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A bounce draft as the bounce team keeps it. */
export class BounceDraft {
  code: string;
  title: string;
  discount: number;
  contactEmail: string;
  region: string;
  sendAt: number;
  graceDays: number;
  maximum: number;
  description: string;
  quantity: number;
  status: BounceDraftStatus;

  constructor(
    code: string,
    title: string,
    discount: number,
    contactEmail: string,
    region: string,
    sendAt: number,
    graceDays: number,
    maximum: number,
    description: string,
    quantity: number,
    status: BounceDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.discount = discount;
    this.contactEmail = contactEmail;
    this.region = region;
    this.sendAt = sendAt;
    this.graceDays = graceDays;
    this.maximum = maximum;
    this.description = description;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: BounceDraftStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: BounceDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedExposure(): number {
    return Math.round((this.quantity - this.graceDays) * 100) / 100;
  }

  copy(): BounceDraft {
    return new BounceDraft(
      this.code,
      this.title,
      this.discount,
      this.contactEmail,
      this.region,
      this.sendAt,
      this.graceDays,
      this.maximum,
      this.description,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a bounce draft in status open. */
export function newBounceDraft(code: string, title: string): BounceDraft {
  return new BounceDraft(code, title, 0, "", "", 0, 0, 0, "", 0, "open");
}
