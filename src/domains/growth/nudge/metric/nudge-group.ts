import * as text from "../../../../kit/text.js";

/** Where a nudge group is in its life cycle. */
export type NudgeGroupStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A nudge group as the nudge team keeps it. */
export class NudgeGroup {
  code: string;
  title: string;
  attributes: Map<string, string>;
  score: number;
  notes: string;
  clicks: number;
  durationMinutes: number;
  externalRef: string;
  rate: number;
  ratio: number;
  startsAt: number;
  status: NudgeGroupStatus;

  constructor(
    code: string,
    title: string,
    attributes: Map<string, string>,
    score: number,
    notes: string,
    clicks: number,
    durationMinutes: number,
    externalRef: string,
    rate: number,
    ratio: number,
    startsAt: number,
    status: NudgeGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attributes = attributes;
    this.score = score;
    this.notes = notes;
    this.clicks = clicks;
    this.durationMinutes = durationMinutes;
    this.externalRef = externalRef;
    this.rate = rate;
    this.ratio = ratio;
    this.startsAt = startsAt;
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

  canMoveTo(next: NudgeGroupStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
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

  moveTo(next: NudgeGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"nudge group"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedTotal(): number {
    return Math.round((this.rate + this.score) * 100) / 100;
  }

  copy(): NudgeGroup {
    return new NudgeGroup(
      this.code,
      this.title,
      this.attributes,
      this.score,
      this.notes,
      this.clicks,
      this.durationMinutes,
      this.externalRef,
      this.rate,
      this.ratio,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a nudge group in status draft. */
export function newNudgeGroup(code: string, title: string): NudgeGroup {
  return new NudgeGroup(code, title, new Map<string, string>(), 0, "", 0, 0, "", 0, 0, 0, "draft");
}
