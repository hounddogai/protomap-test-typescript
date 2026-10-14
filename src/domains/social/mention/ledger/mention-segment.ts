import * as text from "../../../../kit/text.js";

/** Where a mention segment is in its life cycle. */
export type MentionSegmentStatus = "requested" | "granted" | "revoked" | "expired";

/** A mention segment as the mention team keeps it. */
export class MentionSegment {
  code: string;
  label: string;
  version: number;
  score: number;
  title: string;
  endsAt: number;
  campaignRef: string;
  revision: number;
  country: string;
  status: MentionSegmentStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    score: number,
    title: string,
    endsAt: number,
    campaignRef: string,
    revision: number,
    country: string,
    status: MentionSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.score = score;
    this.title = title;
    this.endsAt = endsAt;
    this.campaignRef = campaignRef;
    this.revision = revision;
    this.country = country;
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

  canMoveTo(next: MentionSegmentStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
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

  moveTo(next: MentionSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${"mention segment"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.score - this.endsAt) * 100) / 100;
  }

  copy(): MentionSegment {
    return new MentionSegment(
      this.code,
      this.label,
      this.version,
      this.score,
      this.title,
      this.endsAt,
      this.campaignRef,
      this.revision,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a mention segment in status requested. */
export function newMentionSegment(code: string, label: string): MentionSegment {
  return new MentionSegment(code, label, 0, 0, "", 0, "", 0, "", "requested");
}
