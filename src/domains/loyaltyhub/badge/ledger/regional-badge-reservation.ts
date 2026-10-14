import * as text from "../../../../kit/text.js";

/** Where a regional badge reservation is in its life cycle. */
export type RegionalBadgeReservationStatus = "created" | "validated" | "published" | "retired";

/** A regional badge reservation as the badge team keeps it. */
export class RegionalBadgeReservation {
  code: string;
  title: string;
  tags: string[];
  bid: number;
  region: string;
  durationMinutes: number;
  attempts: number;
  score: number;
  attributes: Map<string, string>;
  status: RegionalBadgeReservationStatus;

  constructor(
    code: string,
    title: string,
    tags: string[],
    bid: number,
    region: string,
    durationMinutes: number,
    attempts: number,
    score: number,
    attributes: Map<string, string>,
    status: RegionalBadgeReservationStatus,
  ) {
    this.code = code;
    this.title = title;
    this.tags = tags;
    this.bid = bid;
    this.region = region;
    this.durationMinutes = durationMinutes;
    this.attempts = attempts;
    this.score = score;
    this.attributes = attributes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalBadgeReservationStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RegionalBadgeReservationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional badge reservation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netLoad(): number {
    return Math.round((this.durationMinutes + this.score) * 100) / 100;
  }

  copy(): RegionalBadgeReservation {
    return new RegionalBadgeReservation(
      this.code,
      this.title,
      this.tags,
      this.bid,
      this.region,
      this.durationMinutes,
      this.attempts,
      this.score,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a regional badge reservation in status created. */
export function newRegionalBadgeReservation(code: string, title: string): RegionalBadgeReservation {
  return new RegionalBadgeReservation(code, title, [], 0, "", 0, 0, 0, new Map<string, string>(), "created");
}
