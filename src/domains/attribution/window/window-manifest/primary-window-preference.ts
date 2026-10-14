import * as text from "../../../../kit/text.js";

/** Where a primary window preference is in its life cycle. */
export type PrimaryWindowPreferenceStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a primary window preference and its current status. */
export class PrimaryWindowPreference {
  code: string;
  title: string;
  quantity: number;
  currency: string;
  capacity: number;
  checksum: string;
  startsAt: number;
  minimum: number;
  status: PrimaryWindowPreferenceStatus;

  constructor(
    code: string,
    title: string,
    quantity: number,
    currency: string,
    capacity: number,
    checksum: string,
    startsAt: number,
    minimum: number,
    status: PrimaryWindowPreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.quantity = quantity;
    this.currency = currency;
    this.capacity = capacity;
    this.checksum = checksum;
    this.startsAt = startsAt;
    this.minimum = minimum;
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

  canMoveTo(next: PrimaryWindowPreferenceStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
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
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryWindowPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary window preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"primary window preference"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.quantity + this.minimum) * 100) / 100;
  }

  copy(): PrimaryWindowPreference {
    return new PrimaryWindowPreference(
      this.code,
      this.title,
      this.quantity,
      this.currency,
      this.capacity,
      this.checksum,
      this.startsAt,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a primary window preference in status requested. */
export function newPrimaryWindowPreference(code: string, title: string): PrimaryWindowPreference {
  return new PrimaryWindowPreference(code, title, 0, "", 0, "", 0, 0, "requested");
}
