import * as text from "../../../../kit/text.js";

/** Where a legacy proof record is in its life cycle. */
export type LegacyProofRecordStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a legacy proof record and its current status. */
export class LegacyProofRecord {
  code: string;
  title: string;
  cohort: string;
  region: string;
  channel: string;
  quantity: number;
  status: LegacyProofRecordStatus;

  constructor(
    code: string,
    title: string,
    cohort: string,
    region: string,
    channel: string,
    quantity: number,
    status: LegacyProofRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.region = region;
    this.channel = channel;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyProofRecordStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyProofRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy proof record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): LegacyProofRecord {
    return new LegacyProofRecord(
      this.code,
      this.title,
      this.cohort,
      this.region,
      this.channel,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a legacy proof record in status proposed. */
export function newLegacyProofRecord(code: string, title: string): LegacyProofRecord {
  return new LegacyProofRecord(code, title, "", "", "", 0, "proposed");
}
