import * as text from "../../../../kit/text.js";

/** Where a default sender score is in its life cycle. */
export type DefaultSenderScoreStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a default sender score and its current status. */
export class DefaultSenderScore {
  code: string;
  title: string;
  approved: boolean;
  clicks: number;
  startsAt: number;
  openRate: number;
  archived: boolean;
  status: DefaultSenderScoreStatus;

  constructor(
    code: string,
    title: string,
    approved: boolean,
    clicks: number,
    startsAt: number,
    openRate: number,
    archived: boolean,
    status: DefaultSenderScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.clicks = clicks;
    this.startsAt = startsAt;
    this.openRate = openRate;
    this.archived = archived;
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

  canMoveTo(next: DefaultSenderScoreStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "closed";
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: DefaultSenderScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default sender score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netVolume(): number {
    return Math.round((this.clicks - this.openRate) * 100) / 100;
  }

  copy(): DefaultSenderScore {
    return new DefaultSenderScore(
      this.code,
      this.title,
      this.approved,
      this.clicks,
      this.startsAt,
      this.openRate,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a default sender score in status draft. */
export function newDefaultSenderScore(code: string, title: string): DefaultSenderScore {
  return new DefaultSenderScore(code, title, false, 0, 0, 0, false, "draft");
}
