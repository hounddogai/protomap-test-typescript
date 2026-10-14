import * as text from "../../../../kit/text.js";

/** Where a strict creative slot is in its life cycle. */
export type StrictCreativeSlotStatus = "requested" | "granted" | "revoked" | "expired";

/** A strict creative slot. Its code is unique within a tenant. */
export class StrictCreativeSlot {
  code: string;
  title: string;
  revision: number;
  updatedAt: number;
  bid: number;
  margin: number;
  checksum: string;
  utmSource: string;
  clicks: number;
  status: StrictCreativeSlotStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    updatedAt: number,
    bid: number,
    margin: number,
    checksum: string,
    utmSource: string,
    clicks: number,
    status: StrictCreativeSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.updatedAt = updatedAt;
    this.bid = bid;
    this.margin = margin;
    this.checksum = checksum;
    this.utmSource = utmSource;
    this.clicks = clicks;
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

  canMoveTo(next: StrictCreativeSlotStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
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

  moveTo(next: StrictCreativeSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict creative slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedVolume(): number {
    return Math.round((this.revision - this.clicks) * 100) / 100;
  }

  copy(): StrictCreativeSlot {
    return new StrictCreativeSlot(
      this.code,
      this.title,
      this.revision,
      this.updatedAt,
      this.bid,
      this.margin,
      this.checksum,
      this.utmSource,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a strict creative slot in status requested. */
export function newStrictCreativeSlot(code: string, title: string): StrictCreativeSlot {
  return new StrictCreativeSlot(code, title, 0, 0, 0, 0, "", "", 0, "requested");
}
