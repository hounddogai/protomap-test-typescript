import * as text from "../../../../kit/text.js";

/** Where a tiered enrollment snapshot is in its life cycle. */
export type TieredEnrollmentSnapshotStatus = "created" | "validated" | "published" | "retired";

/** A tiered enrollment snapshot. Its code is unique within a tenant. */
export class TieredEnrollmentSnapshot {
  code: string;
  label: string;
  sendAt: number;
  clicks: number;
  segment: string;
  rate: number;
  channel: string;
  description: string;
  utmSource: string;
  status: TieredEnrollmentSnapshotStatus;

  constructor(
    code: string,
    label: string,
    sendAt: number,
    clicks: number,
    segment: string,
    rate: number,
    channel: string,
    description: string,
    utmSource: string,
    status: TieredEnrollmentSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sendAt = sendAt;
    this.clicks = clicks;
    this.segment = segment;
    this.rate = rate;
    this.channel = channel;
    this.description = description;
    this.utmSource = utmSource;
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

  canMoveTo(next: TieredEnrollmentSnapshotStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredEnrollmentSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered enrollment snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveTotal(): number {
    return Math.round((this.rate + this.sendAt) * 100) / 100;
  }

  copy(): TieredEnrollmentSnapshot {
    return new TieredEnrollmentSnapshot(
      this.code,
      this.label,
      this.sendAt,
      this.clicks,
      this.segment,
      this.rate,
      this.channel,
      this.description,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a tiered enrollment snapshot in status created. */
export function newTieredEnrollmentSnapshot(code: string, label: string): TieredEnrollmentSnapshot {
  return new TieredEnrollmentSnapshot(code, label, 0, 0, "", 0, "", "", "", "created");
}
