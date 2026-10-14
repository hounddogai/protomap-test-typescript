import * as text from "../../../../kit/text.js";

/** Where a conversion mapping is in its life cycle. */
export type ConversionMappingStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A conversion mapping as the conversion team keeps it. */
export class ConversionMapping {
  code: string;
  title: string;
  approved: boolean;
  label: string;
  conversionRate: number;
  contactEmail: string;
  revision: number;
  sendAt: number;
  channel: string;
  locale: string;
  region: string;
  status: ConversionMappingStatus;

  constructor(
    code: string,
    title: string,
    approved: boolean,
    label: string,
    conversionRate: number,
    contactEmail: string,
    revision: number,
    sendAt: number,
    channel: string,
    locale: string,
    region: string,
    status: ConversionMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.label = label;
    this.conversionRate = conversionRate;
    this.contactEmail = contactEmail;
    this.revision = revision;
    this.sendAt = sendAt;
    this.channel = channel;
    this.locale = locale;
    this.region = region;
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

  canMoveTo(next: ConversionMappingStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
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
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ConversionMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.title})`;
  }

  weightedVolume(): number {
    return Math.round((this.sendAt - this.conversionRate) * 100) / 100;
  }

  copy(): ConversionMapping {
    return new ConversionMapping(
      this.code,
      this.title,
      this.approved,
      this.label,
      this.conversionRate,
      this.contactEmail,
      this.revision,
      this.sendAt,
      this.channel,
      this.locale,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a conversion mapping in status planned. */
export function newConversionMapping(code: string, title: string): ConversionMapping {
  return new ConversionMapping(code, title, false, "", 0, "", 0, 0, "", "", "", "planned");
}
