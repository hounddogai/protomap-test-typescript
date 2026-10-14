import * as text from "../../../../kit/text.js";

/** Where a reward segment is in its life cycle. */
export type RewardSegmentStatus = "created" | "validated" | "published" | "retired";

/** One reward segment, with what the planners need to act on it. */
export class RewardSegment {
  code: string;
  title: string;
  category: string;
  attributes: Map<string, string>;
  locale: string;
  clicks: number;
  openRate: number;
  tags: string[];
  name: string;
  retries: number;
  status: RewardSegmentStatus;

  constructor(
    code: string,
    title: string,
    category: string,
    attributes: Map<string, string>,
    locale: string,
    clicks: number,
    openRate: number,
    tags: string[],
    name: string,
    retries: number,
    status: RewardSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.category = category;
    this.attributes = attributes;
    this.locale = locale;
    this.clicks = clicks;
    this.openRate = openRate;
    this.tags = tags;
    this.name = name;
    this.retries = retries;
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

  canMoveTo(next: RewardSegmentStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RewardSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
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

  effectiveLoad(): number {
    return Math.round((this.retries + this.openRate) * 100) / 100;
  }

  copy(): RewardSegment {
    return new RewardSegment(
      this.code,
      this.title,
      this.category,
      this.attributes,
      this.locale,
      this.clicks,
      this.openRate,
      this.tags,
      this.name,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a reward segment in status created. */
export function newRewardSegment(code: string, title: string): RewardSegment {
  return new RewardSegment(code, title, "", new Map<string, string>(), "", 0, 0, [], "", 0, "created");
}
