import * as text from "../../../../kit/text.js";

/** Where a flight draft is in its life cycle. */
export type FlightDraftStatus = "requested" | "granted" | "revoked" | "expired";

/** A flight draft. Its code is unique within a tenant. */
export class FlightDraft {
  code: string;
  title: string;
  pinned: boolean;
  label: string;
  sequence: number;
  revision: number;
  notes: string;
  campaignRef: string;
  conversionRate: number;
  status: FlightDraftStatus;

  constructor(
    code: string,
    title: string,
    pinned: boolean,
    label: string,
    sequence: number,
    revision: number,
    notes: string,
    campaignRef: string,
    conversionRate: number,
    status: FlightDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.pinned = pinned;
    this.label = label;
    this.sequence = sequence;
    this.revision = revision;
    this.notes = notes;
    this.campaignRef = campaignRef;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: FlightDraftStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
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

  moveTo(next: FlightDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedTotal(): number {
    return Math.round(this.conversionRate * this.sequence * 100) / 100;
  }

  copy(): FlightDraft {
    return new FlightDraft(
      this.code,
      this.title,
      this.pinned,
      this.label,
      this.sequence,
      this.revision,
      this.notes,
      this.campaignRef,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a flight draft in status requested. */
export function newFlightDraft(code: string, title: string): FlightDraft {
  return new FlightDraft(code, title, false, "", 0, 0, "", "", 0, "requested");
}
