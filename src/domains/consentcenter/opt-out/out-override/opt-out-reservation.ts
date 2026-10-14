import * as text from "../../../../kit/text.js";

/** Where a opt out reservation is in its life cycle. */
export type OptOutReservationStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A opt out reservation. Its code is unique within a tenant. */
export class OptOutReservation {
  code: string;
  label: string;
  clicks: number;
  notes: string;
  updatedAt: number;
  version: number;
  visible: boolean;
  region: string;
  name: string;
  status: OptOutReservationStatus;

  constructor(
    code: string,
    label: string,
    clicks: number,
    notes: string,
    updatedAt: number,
    version: number,
    visible: boolean,
    region: string,
    name: string,
    status: OptOutReservationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.notes = notes;
    this.updatedAt = updatedAt;
    this.version = version;
    this.visible = visible;
    this.region = region;
    this.name = name;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: OptOutReservationStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: OptOutReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netVolume(): number {
    return Math.round((this.clicks + this.version) * 100) / 100;
  }

  copy(): OptOutReservation {
    return new OptOutReservation(
      this.code,
      this.label,
      this.clicks,
      this.notes,
      this.updatedAt,
      this.version,
      this.visible,
      this.region,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a opt out reservation in status planned. */
export function newOptOutReservation(code: string, label: string): OptOutReservation {
  return new OptOutReservation(code, label, 0, "", 0, 0, false, "", "", "planned");
}
