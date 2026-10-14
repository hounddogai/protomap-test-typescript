import * as text from "../../../../kit/text.js";

/** Where a regional conversion slot is in its life cycle. */
export type RegionalConversionSlotStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A regional conversion slot as the conversion team keeps it. */
export class RegionalConversionSlot {
  code: string;
  title: string;
  sendAt: number;
  timezone: string;
  notes: string;
  active: boolean;
  sequence: number;
  ownerId: string;
  minimum: number;
  threshold: number;
  audienceId: string;
  status: RegionalConversionSlotStatus;

  constructor(
    code: string,
    title: string,
    sendAt: number,
    timezone: string,
    notes: string,
    active: boolean,
    sequence: number,
    ownerId: string,
    minimum: number,
    threshold: number,
    audienceId: string,
    status: RegionalConversionSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sendAt = sendAt;
    this.timezone = timezone;
    this.notes = notes;
    this.active = active;
    this.sequence = sequence;
    this.ownerId = ownerId;
    this.minimum = minimum;
    this.threshold = threshold;
    this.audienceId = audienceId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalConversionSlotStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "reopened";
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalConversionSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional conversion slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netExposure(): number {
    return Math.round(this.threshold * this.sequence * 100) / 100;
  }

  copy(): RegionalConversionSlot {
    return new RegionalConversionSlot(
      this.code,
      this.title,
      this.sendAt,
      this.timezone,
      this.notes,
      this.active,
      this.sequence,
      this.ownerId,
      this.minimum,
      this.threshold,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a regional conversion slot in status open. */
export function newRegionalConversionSlot(code: string, title: string): RegionalConversionSlot {
  return new RegionalConversionSlot(code, title, 0, "", "", false, 0, "", 0, 0, "", "open");
}
