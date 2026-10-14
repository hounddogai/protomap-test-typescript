/**
 * The capped opt out digest records of consentcenter's opt out work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped opt out digest is in its life cycle. */
export type CappedOptOutDigestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A capped opt out digest. Its code is unique within a tenant. */
export class CappedOptOutDigest {
  code: string;
  title: string;
  phone: string;
  region: string;
  visible: boolean;
  margin: number;
  audienceId: string;
  priority: number;
  channel: string;
  utmSource: string;
  quantity: number;
  status: CappedOptOutDigestStatus;

  constructor(
    code: string,
    title: string,
    phone: string,
    region: string,
    visible: boolean,
    margin: number,
    audienceId: string,
    priority: number,
    channel: string,
    utmSource: string,
    quantity: number,
    status: CappedOptOutDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.phone = phone;
    this.region = region;
    this.visible = visible;
    this.margin = margin;
    this.audienceId = audienceId;
    this.priority = priority;
    this.channel = channel;
    this.utmSource = utmSource;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedOptOutDigestStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: CappedOptOutDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped opt out digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedTotal(): number {
    return Math.round((this.margin + this.priority) * 100) / 100;
  }

  copy(): CappedOptOutDigest {
    return new CappedOptOutDigest(
      this.code,
      this.title,
      this.phone,
      this.region,
      this.visible,
      this.margin,
      this.audienceId,
      this.priority,
      this.channel,
      this.utmSource,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a capped opt out digest in status proposed. */
export function newCappedOptOutDigest(code: string, title: string): CappedOptOutDigest {
  return new CappedOptOutDigest(code, title, "", "", false, 0, "", 0, "", "", 0, "proposed");
}
