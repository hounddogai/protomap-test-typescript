import * as text from "../../../../kit/text.js";

/** Where a pending touchpoint checkpoint is in its life cycle. */
export type PendingTouchpointCheckpointStatus = "created" | "validated" | "published" | "retired";

/** A pending touchpoint checkpoint. Its code is unique within a tenant. */
export class PendingTouchpointCheckpoint {
  code: string;
  label: string;
  ceiling: number;
  active: boolean;
  discount: number;
  contactEmail: string;
  amount: number;
  rate: number;
  channel: string;
  checksum: string;
  attributes: Map<string, string>;
  status: PendingTouchpointCheckpointStatus;

  constructor(
    code: string,
    label: string,
    ceiling: number,
    active: boolean,
    discount: number,
    contactEmail: string,
    amount: number,
    rate: number,
    channel: string,
    checksum: string,
    attributes: Map<string, string>,
    status: PendingTouchpointCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ceiling = ceiling;
    this.active = active;
    this.discount = discount;
    this.contactEmail = contactEmail;
    this.amount = amount;
    this.rate = rate;
    this.channel = channel;
    this.checksum = checksum;
    this.attributes = attributes;
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

  canMoveTo(next: PendingTouchpointCheckpointStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
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

  moveTo(next: PendingTouchpointCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending touchpoint checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
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

  weightedExposure(): number {
    return Math.round(this.discount * this.rate * 100) / 100;
  }

  copy(): PendingTouchpointCheckpoint {
    return new PendingTouchpointCheckpoint(
      this.code,
      this.label,
      this.ceiling,
      this.active,
      this.discount,
      this.contactEmail,
      this.amount,
      this.rate,
      this.channel,
      this.checksum,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a pending touchpoint checkpoint in status created. */
export function newPendingTouchpointCheckpoint(code: string, label: string): PendingTouchpointCheckpoint {
  return new PendingTouchpointCheckpoint(
    code,
    label,
    0,
    false,
    0,
    "",
    0,
    0,
    "",
    "",
    new Map<string, string>(),
    "created",
  );
}
