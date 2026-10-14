/**
 * The default suppression slot records of consentcenter's suppression work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default suppression slot is in its life cycle. */
export type DefaultSuppressionSlotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A default suppression slot as the suppression team keeps it. */
export class DefaultSuppressionSlot {
  code: string;
  label: string;
  phone: string;
  channel: string;
  description: string;
  expiresAt: number;
  quantity: number;
  title: string;
  locale: string;
  externalRef: string;
  revision: number;
  status: DefaultSuppressionSlotStatus;

  constructor(
    code: string,
    label: string,
    phone: string,
    channel: string,
    description: string,
    expiresAt: number,
    quantity: number,
    title: string,
    locale: string,
    externalRef: string,
    revision: number,
    status: DefaultSuppressionSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.phone = phone;
    this.channel = channel;
    this.description = description;
    this.expiresAt = expiresAt;
    this.quantity = quantity;
    this.title = title;
    this.locale = locale;
    this.externalRef = externalRef;
    this.revision = revision;
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

  canMoveTo(next: DefaultSuppressionSlotStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: DefaultSuppressionSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default suppression slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedVolume(): number {
    return Math.round(this.quantity * this.expiresAt * 100) / 100;
  }

  copy(): DefaultSuppressionSlot {
    return new DefaultSuppressionSlot(
      this.code,
      this.label,
      this.phone,
      this.channel,
      this.description,
      this.expiresAt,
      this.quantity,
      this.title,
      this.locale,
      this.externalRef,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a default suppression slot in status draft. */
export function newDefaultSuppressionSlot(code: string, label: string): DefaultSuppressionSlot {
  return new DefaultSuppressionSlot(code, label, "", "", "", 0, 0, "", "", "", 0, "draft");
}
