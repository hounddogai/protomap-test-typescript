import * as text from "../../../../kit/text.js";

/** Where a pacing reservation is in its life cycle. */
export type PacingReservationStatus = "created" | "validated" | "published" | "retired";

/** The record of a pacing reservation and its current status. */
export class PacingReservation {
  code: string;
  label: string;
  sequence: number;
  impressions: number;
  retries: number;
  summary: string;
  region: string;
  visible: boolean;
  status: PacingReservationStatus;

  constructor(
    code: string,
    label: string,
    sequence: number,
    impressions: number,
    retries: number,
    summary: string,
    region: string,
    visible: boolean,
    status: PacingReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sequence = sequence;
    this.impressions = impressions;
    this.retries = retries;
    this.summary = summary;
    this.region = region;
    this.visible = visible;
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

  canMoveTo(next: PacingReservationStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PacingReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"pacing reservation"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round(this.retries * this.sequence * 100) / 100;
  }

  copy(): PacingReservation {
    return new PacingReservation(
      this.code,
      this.label,
      this.sequence,
      this.impressions,
      this.retries,
      this.summary,
      this.region,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a pacing reservation in status created. */
export function newPacingReservation(code: string, label: string): PacingReservation {
  return new PacingReservation(code, label, 0, 0, 0, "", "", false, "created");
}
