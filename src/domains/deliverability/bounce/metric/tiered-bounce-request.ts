import * as text from "../../../../kit/text.js";

/** Where a tiered bounce request is in its life cycle. */
export type TieredBounceRequestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A tiered bounce request. Its code is unique within a tenant. */
export class TieredBounceRequest {
  code: string;
  title: string;
  sequence: number;
  conversionRate: number;
  revision: number;
  phone: string;
  quantity: number;
  category: string;
  journeyId: string;
  checksum: string;
  status: TieredBounceRequestStatus;

  constructor(
    code: string,
    title: string,
    sequence: number,
    conversionRate: number,
    revision: number,
    phone: string,
    quantity: number,
    category: string,
    journeyId: string,
    checksum: string,
    status: TieredBounceRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sequence = sequence;
    this.conversionRate = conversionRate;
    this.revision = revision;
    this.phone = phone;
    this.quantity = quantity;
    this.category = category;
    this.journeyId = journeyId;
    this.checksum = checksum;
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

  canMoveTo(next: TieredBounceRequestStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredBounceRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered bounce request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedVolume(): number {
    return Math.round((this.revision + this.quantity) * 100) / 100;
  }

  copy(): TieredBounceRequest {
    return new TieredBounceRequest(
      this.code,
      this.title,
      this.sequence,
      this.conversionRate,
      this.revision,
      this.phone,
      this.quantity,
      this.category,
      this.journeyId,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a tiered bounce request in status open. */
export function newTieredBounceRequest(code: string, title: string): TieredBounceRequest {
  return new TieredBounceRequest(code, title, 0, 0, 0, "", 0, "", "", "", "open");
}
