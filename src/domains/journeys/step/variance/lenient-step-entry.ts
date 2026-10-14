import * as text from "../../../../kit/text.js";

/** Where a lenient step entry is in its life cycle. */
export type LenientStepEntryStatus = "requested" | "granted" | "revoked" | "expired";

/** A lenient step entry. Its code is unique within a tenant. */
export class LenientStepEntry {
  code: string;
  name: string;
  updatedAt: number;
  channel: string;
  reviewer: string;
  rate: number;
  ownerId: string;
  checksum: string;
  limit: number;
  version: number;
  cohort: string;
  status: LenientStepEntryStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    channel: string,
    reviewer: string,
    rate: number,
    ownerId: string,
    checksum: string,
    limit: number,
    version: number,
    cohort: string,
    status: LenientStepEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.channel = channel;
    this.reviewer = reviewer;
    this.rate = rate;
    this.ownerId = ownerId;
    this.checksum = checksum;
    this.limit = limit;
    this.version = version;
    this.cohort = cohort;
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

  canMoveTo(next: LenientStepEntryStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: LenientStepEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient step entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedVolume(): number {
    return Math.round((this.rate - this.version) * 100) / 100;
  }

  copy(): LenientStepEntry {
    return new LenientStepEntry(
      this.code,
      this.name,
      this.updatedAt,
      this.channel,
      this.reviewer,
      this.rate,
      this.ownerId,
      this.checksum,
      this.limit,
      this.version,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a lenient step entry in status requested. */
export function newLenientStepEntry(code: string, name: string): LenientStepEntry {
  return new LenientStepEntry(code, name, 0, "", "", 0, "", "", 0, 0, "", "requested");
}
