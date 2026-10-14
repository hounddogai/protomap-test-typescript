import * as text from "../../../../kit/text.js";

/** Where a frequency reservation is in its life cycle. */
export type FrequencyReservationStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One frequency reservation, with what the planners need to act on it. */
export class FrequencyReservation {
  code: string;
  name: string;
  updatedAt: number;
  openRate: number;
  revision: number;
  status: FrequencyReservationStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    openRate: number,
    revision: number,
    status: FrequencyReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.openRate = openRate;
    this.revision = revision;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: FrequencyReservationStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: FrequencyReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"frequency reservation"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.openRate - this.updatedAt) * 100) / 100;
  }

  copy(): FrequencyReservation {
    return new FrequencyReservation(this.code, this.name, this.updatedAt, this.openRate, this.revision, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a frequency reservation in status draft. */
export function newFrequencyReservation(code: string, name: string): FrequencyReservation {
  return new FrequencyReservation(code, name, 0, 0, 0, "draft");
}
