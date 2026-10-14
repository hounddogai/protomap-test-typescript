import * as text from "../../../../kit/text.js";

/** Where a pending subscription group is in its life cycle. */
export type PendingSubscriptionGroupStatus = "created" | "validated" | "published" | "retired";

/** A pending subscription group. Its code is unique within a tenant. */
export class PendingSubscriptionGroup {
  code: string;
  label: string;
  title: string;
  expiresAt: number;
  phone: string;
  description: string;
  priority: number;
  floorValue: number;
  campaignRef: string;
  status: PendingSubscriptionGroupStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    expiresAt: number,
    phone: string,
    description: string,
    priority: number,
    floorValue: number,
    campaignRef: string,
    status: PendingSubscriptionGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.expiresAt = expiresAt;
    this.phone = phone;
    this.description = description;
    this.priority = priority;
    this.floorValue = floorValue;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: PendingSubscriptionGroupStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingSubscriptionGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending subscription group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedTotal(): number {
    return Math.round(this.expiresAt * this.floorValue * 100) / 100;
  }

  copy(): PendingSubscriptionGroup {
    return new PendingSubscriptionGroup(
      this.code,
      this.label,
      this.title,
      this.expiresAt,
      this.phone,
      this.description,
      this.priority,
      this.floorValue,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a pending subscription group in status created. */
export function newPendingSubscriptionGroup(code: string, label: string): PendingSubscriptionGroup {
  return new PendingSubscriptionGroup(code, label, "", 0, "", "", 0, 0, "", "created");
}
