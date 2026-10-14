import * as text from "../../../../kit/text.js";

/** Where a fallback streak bundle is in its life cycle. */
export type FallbackStreakBundleStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a fallback streak bundle and its current status. */
export class FallbackStreakBundle {
  code: string;
  title: string;
  audienceId: string;
  contactEmail: string;
  bid: number;
  weight: number;
  segment: string;
  revision: number;
  margin: number;
  summary: string;
  status: FallbackStreakBundleStatus;

  constructor(
    code: string,
    title: string,
    audienceId: string,
    contactEmail: string,
    bid: number,
    weight: number,
    segment: string,
    revision: number,
    margin: number,
    summary: string,
    status: FallbackStreakBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.audienceId = audienceId;
    this.contactEmail = contactEmail;
    this.bid = bid;
    this.weight = weight;
    this.segment = segment;
    this.revision = revision;
    this.margin = margin;
    this.summary = summary;
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

  canMoveTo(next: FallbackStreakBundleStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: FallbackStreakBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback streak bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netExposure(): number {
    return Math.round((this.margin + this.weight) * 100) / 100;
  }

  copy(): FallbackStreakBundle {
    return new FallbackStreakBundle(
      this.code,
      this.title,
      this.audienceId,
      this.contactEmail,
      this.bid,
      this.weight,
      this.segment,
      this.revision,
      this.margin,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a fallback streak bundle in status new. */
export function newFallbackStreakBundle(code: string, title: string): FallbackStreakBundle {
  return new FallbackStreakBundle(code, title, "", "", 0, 0, "", 0, 0, "", "new");
}
