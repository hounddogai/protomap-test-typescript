import * as text from "../../../../kit/text.js";

/** Where a pending window slot is in its life cycle. */
export type PendingWindowSlotStatus = "requested" | "granted" | "revoked" | "expired";

/** A pending window slot. Its code is unique within a tenant. */
export class PendingWindowSlot {
  code: string;
  name: string;
  locale: string;
  journeyId: string;
  ownerId: string;
  checksum: string;
  frequencyCap: number;
  batchSize: number;
  capacity: number;
  quantity: number;
  channel: string;
  status: PendingWindowSlotStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    journeyId: string,
    ownerId: string,
    checksum: string,
    frequencyCap: number,
    batchSize: number,
    capacity: number,
    quantity: number,
    channel: string,
    status: PendingWindowSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.journeyId = journeyId;
    this.ownerId = ownerId;
    this.checksum = checksum;
    this.frequencyCap = frequencyCap;
    this.batchSize = batchSize;
    this.capacity = capacity;
    this.quantity = quantity;
    this.channel = channel;
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

  canMoveTo(next: PendingWindowSlotStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PendingWindowSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending window slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveExposure(): number {
    return Math.round(this.frequencyCap * this.quantity * 100) / 100;
  }

  copy(): PendingWindowSlot {
    return new PendingWindowSlot(
      this.code,
      this.name,
      this.locale,
      this.journeyId,
      this.ownerId,
      this.checksum,
      this.frequencyCap,
      this.batchSize,
      this.capacity,
      this.quantity,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a pending window slot in status requested. */
export function newPendingWindowSlot(code: string, name: string): PendingWindowSlot {
  return new PendingWindowSlot(code, name, "", "", "", "", 0, 0, 0, 0, "", "requested");
}
