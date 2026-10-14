import * as text from "../../../../kit/text.js";

/** Where a primary funnel record is in its life cycle. */
export type PrimaryFunnelRecordStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A primary funnel record as the funnel team keeps it. */
export class PrimaryFunnelRecord {
  code: string;
  label: string;
  durationMinutes: number;
  channel: string;
  ownerId: string;
  clicks: number;
  status: PrimaryFunnelRecordStatus;

  constructor(
    code: string,
    label: string,
    durationMinutes: number,
    channel: string,
    ownerId: string,
    clicks: number,
    status: PrimaryFunnelRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.durationMinutes = durationMinutes;
    this.channel = channel;
    this.ownerId = ownerId;
    this.clicks = clicks;
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

  canMoveTo(next: PrimaryFunnelRecordStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        return next === "suspended";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryFunnelRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary funnel record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveValue(): number {
    return Math.round((this.durationMinutes + this.clicks) * 100) / 100;
  }

  copy(): PrimaryFunnelRecord {
    return new PrimaryFunnelRecord(
      this.code,
      this.label,
      this.durationMinutes,
      this.channel,
      this.ownerId,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a primary funnel record in status draft. */
export function newPrimaryFunnelRecord(code: string, label: string): PrimaryFunnelRecord {
  return new PrimaryFunnelRecord(code, label, 0, "", "", 0, "draft");
}
