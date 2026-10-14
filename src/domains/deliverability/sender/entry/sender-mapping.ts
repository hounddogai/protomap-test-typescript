import * as text from "../../../../kit/text.js";

/** Where a sender mapping is in its life cycle. */
export type SenderMappingStatus = "requested" | "granted" | "revoked" | "expired";

/** A sender mapping. Its code is unique within a tenant. */
export class SenderMapping {
  code: string;
  title: string;
  durationMinutes: number;
  bid: number;
  limit: number;
  quantity: number;
  weight: number;
  status: SenderMappingStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    bid: number,
    limit: number,
    quantity: number,
    weight: number,
    status: SenderMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.bid = bid;
    this.limit = limit;
    this.quantity = quantity;
    this.weight = weight;
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

  canMoveTo(next: SenderMappingStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SenderMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveExposure(): number {
    return Math.round((this.quantity + this.bid) * 100) / 100;
  }

  copy(): SenderMapping {
    return new SenderMapping(
      this.code,
      this.title,
      this.durationMinutes,
      this.bid,
      this.limit,
      this.quantity,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a sender mapping in status requested. */
export function newSenderMapping(code: string, title: string): SenderMapping {
  return new SenderMapping(code, title, 0, 0, 0, 0, 0, "requested");
}
