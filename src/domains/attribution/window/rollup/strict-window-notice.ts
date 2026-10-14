import * as text from "../../../../kit/text.js";

/** Where a strict window notice is in its life cycle. */
export type StrictWindowNoticeStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a strict window notice and its current status. */
export class StrictWindowNotice {
  code: string;
  label: string;
  notes: string;
  weight: number;
  maximum: number;
  channel: string;
  status: StrictWindowNoticeStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    weight: number,
    maximum: number,
    channel: string,
    status: StrictWindowNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.weight = weight;
    this.maximum = maximum;
    this.channel = channel;
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

  canMoveTo(next: StrictWindowNoticeStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictWindowNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict window notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"strict window notice"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.weight + this.maximum) * 100) / 100;
  }

  copy(): StrictWindowNotice {
    return new StrictWindowNotice(
      this.code,
      this.label,
      this.notes,
      this.weight,
      this.maximum,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a strict window notice in status new. */
export function newStrictWindowNotice(code: string, label: string): StrictWindowNotice {
  return new StrictWindowNotice(code, label, "", 0, 0, "", "new");
}
