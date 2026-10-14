/**
 * The reply mapping records of social's reply work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reply mapping is in its life cycle. */
export type ReplyMappingStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A reply mapping as the reply team keeps it. */
export class ReplyMapping {
  code: string;
  label: string;
  sendAt: number;
  externalRef: string;
  ownerId: string;
  openRate: number;
  status: ReplyMappingStatus;

  constructor(
    code: string,
    label: string,
    sendAt: number,
    externalRef: string,
    ownerId: string,
    openRate: number,
    status: ReplyMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sendAt = sendAt;
    this.externalRef = externalRef;
    this.ownerId = ownerId;
    this.openRate = openRate;
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

  canMoveTo(next: ReplyMappingStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ReplyMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netLoad(): number {
    return Math.round((this.openRate + this.sendAt) * 100) / 100;
  }

  copy(): ReplyMapping {
    return new ReplyMapping(
      this.code,
      this.label,
      this.sendAt,
      this.externalRef,
      this.ownerId,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a reply mapping in status proposed. */
export function newReplyMapping(code: string, label: string): ReplyMapping {
  return new ReplyMapping(code, label, 0, "", "", 0, "proposed");
}
