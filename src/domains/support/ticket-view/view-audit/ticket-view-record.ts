import * as text from "../../../../kit/text.js";

/** Where a ticket view record is in its life cycle. */
export type TicketViewRecordStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a ticket view record and its current status. */
export class TicketViewRecord {
  code: string;
  label: string;
  channel: string;
  openRate: number;
  weight: number;
  maximum: number;
  frequencyCap: number;
  floorValue: number;
  notes: string;
  clicks: number;
  status: TicketViewRecordStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    openRate: number,
    weight: number,
    maximum: number,
    frequencyCap: number,
    floorValue: number,
    notes: string,
    clicks: number,
    status: TicketViewRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.openRate = openRate;
    this.weight = weight;
    this.maximum = maximum;
    this.frequencyCap = frequencyCap;
    this.floorValue = floorValue;
    this.notes = notes;
    this.clicks = clicks;
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

  canMoveTo(next: TicketViewRecordStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "done":
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

  moveTo(next: TicketViewRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"ticket view record"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.openRate + this.floorValue) * 100) / 100;
  }

  copy(): TicketViewRecord {
    return new TicketViewRecord(
      this.code,
      this.label,
      this.channel,
      this.openRate,
      this.weight,
      this.maximum,
      this.frequencyCap,
      this.floorValue,
      this.notes,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a ticket view record in status new. */
export function newTicketViewRecord(code: string, label: string): TicketViewRecord {
  return new TicketViewRecord(code, label, "", 0, 0, 0, 0, 0, "", 0, "new");
}
