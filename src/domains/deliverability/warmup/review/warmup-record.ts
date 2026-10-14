import * as text from "../../../../kit/text.js";

/** Where a warmup record is in its life cycle. */
export type WarmupRecordStatus = "created" | "validated" | "published" | "retired";

/** The record of a warmup record and its current status. */
export class WarmupRecord {
  code: string;
  name: string;
  checksum: string;
  campaignRef: string;
  timezone: string;
  score: number;
  status: WarmupRecordStatus;

  constructor(
    code: string,
    name: string,
    checksum: string,
    campaignRef: string,
    timezone: string,
    score: number,
    status: WarmupRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.campaignRef = campaignRef;
    this.timezone = timezone;
    this.score = score;
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

  canMoveTo(next: WarmupRecordStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
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

  moveTo(next: WarmupRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): WarmupRecord {
    return new WarmupRecord(
      this.code,
      this.name,
      this.checksum,
      this.campaignRef,
      this.timezone,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a warmup record in status created. */
export function newWarmupRecord(code: string, name: string): WarmupRecord {
  return new WarmupRecord(code, name, "", "", "", 0, "created");
}
