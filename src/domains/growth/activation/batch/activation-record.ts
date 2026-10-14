import * as text from "../../../../kit/text.js";

/** Where a activation record is in its life cycle. */
export type ActivationRecordStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a activation record and its current status. */
export class ActivationRecord {
  code: string;
  name: string;
  notes: string;
  impressions: number;
  channel: string;
  status: ActivationRecordStatus;

  constructor(
    code: string,
    name: string,
    notes: string,
    impressions: number,
    channel: string,
    status: ActivationRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.notes = notes;
    this.impressions = impressions;
    this.channel = channel;
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

  canMoveTo(next: ActivationRecordStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ActivationRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.impressions;
  }

  copy(): ActivationRecord {
    return new ActivationRecord(this.code, this.name, this.notes, this.impressions, this.channel, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a activation record in status requested. */
export function newActivationRecord(code: string, name: string): ActivationRecord {
  return new ActivationRecord(code, name, "", 0, "", "requested");
}
