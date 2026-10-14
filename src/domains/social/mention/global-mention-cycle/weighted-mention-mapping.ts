import * as text from "../../../../kit/text.js";

/** Where a weighted mention mapping is in its life cycle. */
export type WeightedMentionMappingStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A weighted mention mapping as the mention team keeps it. */
export class WeightedMentionMapping {
  code: string;
  title: string;
  floorValue: number;
  locale: string;
  segment: string;
  contactEmail: string;
  journeyId: string;
  name: string;
  source: string;
  visible: boolean;
  impressions: number;
  status: WeightedMentionMappingStatus;

  constructor(
    code: string,
    title: string,
    floorValue: number,
    locale: string,
    segment: string,
    contactEmail: string,
    journeyId: string,
    name: string,
    source: string,
    visible: boolean,
    impressions: number,
    status: WeightedMentionMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.floorValue = floorValue;
    this.locale = locale;
    this.segment = segment;
    this.contactEmail = contactEmail;
    this.journeyId = journeyId;
    this.name = name;
    this.source = source;
    this.visible = visible;
    this.impressions = impressions;
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

  canMoveTo(next: WeightedMentionMappingStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: WeightedMentionMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted mention mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedVolume(): number {
    return Math.round(this.impressions * this.floorValue * 100) / 100;
  }

  copy(): WeightedMentionMapping {
    return new WeightedMentionMapping(
      this.code,
      this.title,
      this.floorValue,
      this.locale,
      this.segment,
      this.contactEmail,
      this.journeyId,
      this.name,
      this.source,
      this.visible,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a weighted mention mapping in status planned. */
export function newWeightedMentionMapping(code: string, title: string): WeightedMentionMapping {
  return new WeightedMentionMapping(code, title, 0, "", "", "", "", "", "", false, 0, "planned");
}
