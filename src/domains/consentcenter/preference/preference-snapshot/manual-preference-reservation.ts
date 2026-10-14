import * as text from "../../../../kit/text.js";

/** Where a manual preference reservation is in its life cycle. */
export type ManualPreferenceReservationStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a manual preference reservation and its current status. */
export class ManualPreferenceReservation {
  code: string;
  name: string;
  channel: string;
  bid: number;
  margin: number;
  campaignRef: string;
  minimum: number;
  summary: string;
  audienceId: string;
  status: ManualPreferenceReservationStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    bid: number,
    margin: number,
    campaignRef: string,
    minimum: number,
    summary: string,
    audienceId: string,
    status: ManualPreferenceReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.bid = bid;
    this.margin = margin;
    this.campaignRef = campaignRef;
    this.minimum = minimum;
    this.summary = summary;
    this.audienceId = audienceId;
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

  canMoveTo(next: ManualPreferenceReservationStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ManualPreferenceReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual preference reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedValue(): number {
    return Math.round(this.bid * this.minimum * 100) / 100;
  }

  copy(): ManualPreferenceReservation {
    return new ManualPreferenceReservation(
      this.code,
      this.name,
      this.channel,
      this.bid,
      this.margin,
      this.campaignRef,
      this.minimum,
      this.summary,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a manual preference reservation in status planned. */
export function newManualPreferenceReservation(code: string, name: string): ManualPreferenceReservation {
  return new ManualPreferenceReservation(code, name, "", 0, 0, "", 0, "", "", "planned");
}
