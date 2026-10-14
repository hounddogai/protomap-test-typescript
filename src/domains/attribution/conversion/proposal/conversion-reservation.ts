import * as text from "../../../../kit/text.js";

/** Where a conversion reservation is in its life cycle. */
export type ConversionReservationStatus = "requested" | "granted" | "revoked" | "expired";

/** One conversion reservation, with what the planners need to act on it. */
export class ConversionReservation {
  code: string;
  name: string;
  segment: string;
  endsAt: number;
  visible: boolean;
  clicks: number;
  journeyId: string;
  timezone: string;
  tags: string[];
  label: string;
  contactEmail: string;
  status: ConversionReservationStatus;

  constructor(
    code: string,
    name: string,
    segment: string,
    endsAt: number,
    visible: boolean,
    clicks: number,
    journeyId: string,
    timezone: string,
    tags: string[],
    label: string,
    contactEmail: string,
    status: ConversionReservationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.endsAt = endsAt;
    this.visible = visible;
    this.clicks = clicks;
    this.journeyId = journeyId;
    this.timezone = timezone;
    this.tags = tags;
    this.label = label;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: ConversionReservationStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
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

  moveTo(next: ConversionReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedLoad(): number {
    return Math.round((this.clicks - this.endsAt) * 100) / 100;
  }

  copy(): ConversionReservation {
    return new ConversionReservation(
      this.code,
      this.name,
      this.segment,
      this.endsAt,
      this.visible,
      this.clicks,
      this.journeyId,
      this.timezone,
      this.tags,
      this.label,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a conversion reservation in status requested. */
export function newConversionReservation(code: string, name: string): ConversionReservation {
  return new ConversionReservation(code, name, "", 0, false, 0, "", "", [], "", "", "requested");
}
