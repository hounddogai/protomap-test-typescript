import * as text from "../../../../kit/text.js";

/** Where a level bundle is in its life cycle. */
export type LevelBundleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One level bundle, with what the planners need to act on it. */
export class LevelBundle {
  code: string;
  title: string;
  discount: number;
  unit: string;
  pinned: boolean;
  rate: number;
  durationMinutes: number;
  bid: number;
  attributes: Map<string, string>;
  source: string;
  status: LevelBundleStatus;

  constructor(
    code: string,
    title: string,
    discount: number,
    unit: string,
    pinned: boolean,
    rate: number,
    durationMinutes: number,
    bid: number,
    attributes: Map<string, string>,
    source: string,
    status: LevelBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.discount = discount;
    this.unit = unit;
    this.pinned = pinned;
    this.rate = rate;
    this.durationMinutes = durationMinutes;
    this.bid = bid;
    this.attributes = attributes;
    this.source = source;
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

  canMoveTo(next: LevelBundleStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: LevelBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedVolume(): number {
    return Math.round((this.discount - this.durationMinutes) * 100) / 100;
  }

  copy(): LevelBundle {
    return new LevelBundle(
      this.code,
      this.title,
      this.discount,
      this.unit,
      this.pinned,
      this.rate,
      this.durationMinutes,
      this.bid,
      this.attributes,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a level bundle in status draft. */
export function newLevelBundle(code: string, title: string): LevelBundle {
  return new LevelBundle(code, title, 0, "", false, 0, 0, 0, new Map<string, string>(), "", "draft");
}
