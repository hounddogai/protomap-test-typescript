import * as text from "../../../../kit/text.js";

/** Where a scheduled mention mapping is in its life cycle. */
export type ScheduledMentionMappingStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A scheduled mention mapping. Its code is unique within a tenant. */
export class ScheduledMentionMapping {
  code: string;
  label: string;
  tags: string[];
  audienceId: string;
  source: string;
  campaignRef: string;
  segment: string;
  ownerId: string;
  ratio: number;
  clicks: number;
  status: ScheduledMentionMappingStatus;

  constructor(
    code: string,
    label: string,
    tags: string[],
    audienceId: string,
    source: string,
    campaignRef: string,
    segment: string,
    ownerId: string,
    ratio: number,
    clicks: number,
    status: ScheduledMentionMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.tags = tags;
    this.audienceId = audienceId;
    this.source = source;
    this.campaignRef = campaignRef;
    this.segment = segment;
    this.ownerId = ownerId;
    this.ratio = ratio;
    this.clicks = clicks;
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

  canMoveTo(next: ScheduledMentionMappingStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
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

  moveTo(next: ScheduledMentionMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled mention mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedLoad(): number {
    return Math.round(this.clicks * this.ratio * 100) / 100;
  }

  copy(): ScheduledMentionMapping {
    return new ScheduledMentionMapping(
      this.code,
      this.label,
      this.tags,
      this.audienceId,
      this.source,
      this.campaignRef,
      this.segment,
      this.ownerId,
      this.ratio,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a scheduled mention mapping in status planned. */
export function newScheduledMentionMapping(code: string, label: string): ScheduledMentionMapping {
  return new ScheduledMentionMapping(code, label, [], "", "", "", "", "", 0, 0, "planned");
}
