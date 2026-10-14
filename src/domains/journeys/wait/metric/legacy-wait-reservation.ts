import * as text from "../../../../kit/text.js";

/** Where a legacy wait reservation is in its life cycle. */
export type LegacyWaitReservationStatus = "new" | "queued" | "running" | "done" | "failed";

/** A legacy wait reservation. Its code is unique within a tenant. */
export class LegacyWaitReservation {
  code: string;
  title: string;
  floorValue: number;
  approved: boolean;
  audienceId: string;
  rate: number;
  retries: number;
  utmSource: string;
  description: string;
  variant: string;
  status: LegacyWaitReservationStatus;

  constructor(
    code: string,
    title: string,
    floorValue: number,
    approved: boolean,
    audienceId: string,
    rate: number,
    retries: number,
    utmSource: string,
    description: string,
    variant: string,
    status: LegacyWaitReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.floorValue = floorValue;
    this.approved = approved;
    this.audienceId = audienceId;
    this.rate = rate;
    this.retries = retries;
    this.utmSource = utmSource;
    this.description = description;
    this.variant = variant;
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

  canMoveTo(next: LegacyWaitReservationStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "failed";
      case "queued":
        return next === "running" || next === "failed";
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

  moveTo(next: LegacyWaitReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy wait reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"legacy wait reservation"} ${this.code}`;
  }

  adjustedTotal(): number {
    return Math.round(this.rate * this.retries * 100) / 100;
  }

  copy(): LegacyWaitReservation {
    return new LegacyWaitReservation(
      this.code,
      this.title,
      this.floorValue,
      this.approved,
      this.audienceId,
      this.rate,
      this.retries,
      this.utmSource,
      this.description,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a legacy wait reservation in status new. */
export function newLegacyWaitReservation(code: string, title: string): LegacyWaitReservation {
  return new LegacyWaitReservation(code, title, 0, false, "", 0, 0, "", "", "", "new");
}
