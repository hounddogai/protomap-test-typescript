import * as text from "../../../../kit/text.js";

/** Where a legacy double opt in reservation is in its life cycle. */
export type LegacyDoubleOptInReservationStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A legacy double opt in reservation. Its code is unique within a tenant. */
export class LegacyDoubleOptInReservation {
  code: string;
  title: string;
  checksum: string;
  locale: string;
  source: string;
  channel: string;
  openRate: number;
  amount: number;
  notes: string;
  campaignRef: string;
  impressions: number;
  status: LegacyDoubleOptInReservationStatus;

  constructor(
    code: string,
    title: string,
    checksum: string,
    locale: string,
    source: string,
    channel: string,
    openRate: number,
    amount: number,
    notes: string,
    campaignRef: string,
    impressions: number,
    status: LegacyDoubleOptInReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.checksum = checksum;
    this.locale = locale;
    this.source = source;
    this.channel = channel;
    this.openRate = openRate;
    this.amount = amount;
    this.notes = notes;
    this.campaignRef = campaignRef;
    this.impressions = impressions;
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

  canMoveTo(next: LegacyDoubleOptInReservationStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: LegacyDoubleOptInReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy double opt in reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  adjustedVolume(): number {
    return Math.round(this.amount * this.impressions * 100) / 100;
  }

  copy(): LegacyDoubleOptInReservation {
    return new LegacyDoubleOptInReservation(
      this.code,
      this.title,
      this.checksum,
      this.locale,
      this.source,
      this.channel,
      this.openRate,
      this.amount,
      this.notes,
      this.campaignRef,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a legacy double opt in reservation in status proposed. */
export function newLegacyDoubleOptInReservation(code: string, title: string): LegacyDoubleOptInReservation {
  return new LegacyDoubleOptInReservation(code, title, "", "", "", "", 0, 0, "", "", 0, "proposed");
}
