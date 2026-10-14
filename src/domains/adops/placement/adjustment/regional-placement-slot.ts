import * as text from "../../../../kit/text.js";

/** Where a regional placement slot is in its life cycle. */
export type RegionalPlacementSlotStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A regional placement slot. Its code is unique within a tenant. */
export class RegionalPlacementSlot {
  code: string;
  title: string;
  country: string;
  reviewer: string;
  channel: string;
  audienceId: string;
  limit: number;
  region: string;
  phone: string;
  utmSource: string;
  attributes: Map<string, string>;
  status: RegionalPlacementSlotStatus;

  constructor(
    code: string,
    title: string,
    country: string,
    reviewer: string,
    channel: string,
    audienceId: string,
    limit: number,
    region: string,
    phone: string,
    utmSource: string,
    attributes: Map<string, string>,
    status: RegionalPlacementSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.reviewer = reviewer;
    this.channel = channel;
    this.audienceId = audienceId;
    this.limit = limit;
    this.region = region;
    this.phone = phone;
    this.utmSource = utmSource;
    this.attributes = attributes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalPlacementSlotStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: RegionalPlacementSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional placement slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.limit;
  }

  copy(): RegionalPlacementSlot {
    return new RegionalPlacementSlot(
      this.code,
      this.title,
      this.country,
      this.reviewer,
      this.channel,
      this.audienceId,
      this.limit,
      this.region,
      this.phone,
      this.utmSource,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a regional placement slot in status open. */
export function newRegionalPlacementSlot(code: string, title: string): RegionalPlacementSlot {
  return new RegionalPlacementSlot(code, title, "", "", "", "", 0, "", "", "", new Map<string, string>(), "open");
}
