import * as text from "../../../../kit/text.js";

/** Where a global escalation record is in its life cycle. */
export type GlobalEscalationRecordStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One global escalation record, with what the planners need to act on it. */
export class GlobalEscalationRecord {
  code: string;
  name: string;
  campaignRef: string;
  archived: boolean;
  score: number;
  capacity: number;
  weight: number;
  sequence: number;
  sendAt: number;
  status: GlobalEscalationRecordStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    archived: boolean,
    score: number,
    capacity: number,
    weight: number,
    sequence: number,
    sendAt: number,
    status: GlobalEscalationRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.archived = archived;
    this.score = score;
    this.capacity = capacity;
    this.weight = weight;
    this.sequence = sequence;
    this.sendAt = sendAt;
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

  canMoveTo(next: GlobalEscalationRecordStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
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
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: GlobalEscalationRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global escalation record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedValue(): number {
    return Math.round((this.sendAt + this.weight) * 100) / 100;
  }

  copy(): GlobalEscalationRecord {
    return new GlobalEscalationRecord(
      this.code,
      this.name,
      this.campaignRef,
      this.archived,
      this.score,
      this.capacity,
      this.weight,
      this.sequence,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a global escalation record in status proposed. */
export function newGlobalEscalationRecord(code: string, name: string): GlobalEscalationRecord {
  return new GlobalEscalationRecord(code, name, "", false, 0, 0, 0, 0, 0, "proposed");
}
