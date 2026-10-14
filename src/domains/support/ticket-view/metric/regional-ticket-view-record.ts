import * as text from "../../../../kit/text.js";

/** Where a regional ticket view record is in its life cycle. */
export type RegionalTicketViewRecordStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a regional ticket view record and its current status. */
export class RegionalTicketViewRecord {
  code: string;
  name: string;
  sequence: number;
  impressions: number;
  channel: string;
  archived: boolean;
  status: RegionalTicketViewRecordStatus;

  constructor(
    code: string,
    name: string,
    sequence: number,
    impressions: number,
    channel: string,
    archived: boolean,
    status: RegionalTicketViewRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sequence = sequence;
    this.impressions = impressions;
    this.channel = channel;
    this.archived = archived;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalTicketViewRecordStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalTicketViewRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional ticket view record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"regional ticket view record"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.impressions + this.sequence) * 100) / 100;
  }

  copy(): RegionalTicketViewRecord {
    return new RegionalTicketViewRecord(
      this.code,
      this.name,
      this.sequence,
      this.impressions,
      this.channel,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a regional ticket view record in status new. */
export function newRegionalTicketViewRecord(code: string, name: string): RegionalTicketViewRecord {
  return new RegionalTicketViewRecord(code, name, 0, 0, "", false, "new");
}
