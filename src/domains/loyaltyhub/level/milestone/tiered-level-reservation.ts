import * as text from "../../../../kit/text.js";

/** Where a tiered level reservation is in its life cycle. */
export type TieredLevelReservationStatus = "requested" | "granted" | "revoked" | "expired";

/** A tiered level reservation. Its code is unique within a tenant. */
export class TieredLevelReservation {
  code: string;
  title: string;
  durationMinutes: number;
  margin: number;
  reviewer: string;
  category: string;
  status: TieredLevelReservationStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    margin: number,
    reviewer: string,
    category: string,
    status: TieredLevelReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.margin = margin;
    this.reviewer = reviewer;
    this.category = category;
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

  canMoveTo(next: TieredLevelReservationStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredLevelReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered level reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveVolume(): number {
    return Math.round(this.durationMinutes * this.margin * 100) / 100;
  }

  copy(): TieredLevelReservation {
    return new TieredLevelReservation(
      this.code,
      this.title,
      this.durationMinutes,
      this.margin,
      this.reviewer,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a tiered level reservation in status requested. */
export function newTieredLevelReservation(code: string, title: string): TieredLevelReservation {
  return new TieredLevelReservation(code, title, 0, 0, "", "", "requested");
}
