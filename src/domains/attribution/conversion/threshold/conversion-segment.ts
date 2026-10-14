import * as text from "../../../../kit/text.js";

/** Where a conversion segment is in its life cycle. */
export type ConversionSegmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a conversion segment and its current status. */
export class ConversionSegment {
  code: string;
  label: string;
  notes: string;
  visible: boolean;
  campaignRef: string;
  attributes: Map<string, string>;
  checksum: string;
  createdAt: number;
  status: ConversionSegmentStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    visible: boolean,
    campaignRef: string,
    attributes: Map<string, string>,
    checksum: string,
    createdAt: number,
    status: ConversionSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.visible = visible;
    this.campaignRef = campaignRef;
    this.attributes = attributes;
    this.checksum = checksum;
    this.createdAt = createdAt;
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

  canMoveTo(next: ConversionSegmentStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        switch (next) {
          case "completed":
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
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ConversionSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.createdAt;
  }

  copy(): ConversionSegment {
    return new ConversionSegment(
      this.code,
      this.label,
      this.notes,
      this.visible,
      this.campaignRef,
      this.attributes,
      this.checksum,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a conversion segment in status planned. */
export function newConversionSegment(code: string, label: string): ConversionSegment {
  return new ConversionSegment(code, label, "", false, "", new Map<string, string>(), "", 0, "planned");
}
