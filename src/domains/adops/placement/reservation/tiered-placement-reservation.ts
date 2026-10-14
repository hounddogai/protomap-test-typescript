import * as text from "../../../../kit/text.js";

/** Where a tiered placement reservation is in its life cycle. */
export type TieredPlacementReservationStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One tiered placement reservation, with what the planners need to act on it. */
export class TieredPlacementReservation {
  code: string;
  title: string;
  archived: boolean;
  journeyId: string;
  margin: number;
  ceiling: number;
  campaignRef: string;
  budget: number;
  startsAt: number;
  country: string;
  status: TieredPlacementReservationStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    journeyId: string,
    margin: number,
    ceiling: number,
    campaignRef: string,
    budget: number,
    startsAt: number,
    country: string,
    status: TieredPlacementReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.journeyId = journeyId;
    this.margin = margin;
    this.ceiling = ceiling;
    this.campaignRef = campaignRef;
    this.budget = budget;
    this.startsAt = startsAt;
    this.country = country;
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

  canMoveTo(next: TieredPlacementReservationStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredPlacementReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered placement reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"tiered placement reservation"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round(this.startsAt * this.budget * 100) / 100;
  }

  copy(): TieredPlacementReservation {
    return new TieredPlacementReservation(
      this.code,
      this.title,
      this.archived,
      this.journeyId,
      this.margin,
      this.ceiling,
      this.campaignRef,
      this.budget,
      this.startsAt,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a tiered placement reservation in status proposed. */
export function newTieredPlacementReservation(code: string, title: string): TieredPlacementReservation {
  return new TieredPlacementReservation(code, title, false, "", 0, 0, "", 0, 0, "", "proposed");
}
