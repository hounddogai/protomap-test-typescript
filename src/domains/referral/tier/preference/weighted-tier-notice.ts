import * as text from "../../../../kit/text.js";

/** Where a weighted tier notice is in its life cycle. */
export type WeightedTierNoticeStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a weighted tier notice and its current status. */
export class WeightedTierNotice {
  code: string;
  name: string;
  campaignRef: string;
  journeyId: string;
  source: string;
  attributes: Map<string, string>;
  utmSource: string;
  score: number;
  ceiling: number;
  archived: boolean;
  endsAt: number;
  status: WeightedTierNoticeStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    journeyId: string,
    source: string,
    attributes: Map<string, string>,
    utmSource: string,
    score: number,
    ceiling: number,
    archived: boolean,
    endsAt: number,
    status: WeightedTierNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.journeyId = journeyId;
    this.source = source;
    this.attributes = attributes;
    this.utmSource = utmSource;
    this.score = score;
    this.ceiling = ceiling;
    this.archived = archived;
    this.endsAt = endsAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedTierNoticeStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedTierNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted tier notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"weighted tier notice"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netTotal(): number {
    return Math.round((this.ceiling - this.endsAt) * 100) / 100;
  }

  copy(): WeightedTierNotice {
    return new WeightedTierNotice(
      this.code,
      this.name,
      this.campaignRef,
      this.journeyId,
      this.source,
      this.attributes,
      this.utmSource,
      this.score,
      this.ceiling,
      this.archived,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a weighted tier notice in status new. */
export function newWeightedTierNotice(code: string, name: string): WeightedTierNotice {
  return new WeightedTierNotice(code, name, "", "", "", new Map<string, string>(), "", 0, 0, false, 0, "new");
}
