import * as text from "../../../../kit/text.js";

/** Where a primary sla checkpoint is in its life cycle. */
export type PrimarySlaCheckpointStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a primary sla checkpoint and its current status. */
export class PrimarySlaCheckpoint {
  code: string;
  title: string;
  minimum: number;
  attributes: Map<string, string>;
  ratio: number;
  capacity: number;
  updatedAt: number;
  impressions: number;
  archived: boolean;
  audienceId: string;
  campaignRef: string;
  status: PrimarySlaCheckpointStatus;

  constructor(
    code: string,
    title: string,
    minimum: number,
    attributes: Map<string, string>,
    ratio: number,
    capacity: number,
    updatedAt: number,
    impressions: number,
    archived: boolean,
    audienceId: string,
    campaignRef: string,
    status: PrimarySlaCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.minimum = minimum;
    this.attributes = attributes;
    this.ratio = ratio;
    this.capacity = capacity;
    this.updatedAt = updatedAt;
    this.impressions = impressions;
    this.archived = archived;
    this.audienceId = audienceId;
    this.campaignRef = campaignRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimarySlaCheckpointStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimarySlaCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary sla checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedLoad(): number {
    return Math.round(this.capacity * this.ratio * 100) / 100;
  }

  copy(): PrimarySlaCheckpoint {
    return new PrimarySlaCheckpoint(
      this.code,
      this.title,
      this.minimum,
      this.attributes,
      this.ratio,
      this.capacity,
      this.updatedAt,
      this.impressions,
      this.archived,
      this.audienceId,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a primary sla checkpoint in status draft. */
export function newPrimarySlaCheckpoint(code: string, title: string): PrimarySlaCheckpoint {
  return new PrimarySlaCheckpoint(code, title, 0, new Map<string, string>(), 0, 0, 0, 0, false, "", "", "draft");
}
