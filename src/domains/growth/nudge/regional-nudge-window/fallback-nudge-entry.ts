import * as text from "../../../../kit/text.js";

/** Where a fallback nudge entry is in its life cycle. */
export type FallbackNudgeEntryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One fallback nudge entry, with what the planners need to act on it. */
export class FallbackNudgeEntry {
  code: string;
  title: string;
  durationMinutes: number;
  channel: string;
  tags: string[];
  version: number;
  quantity: number;
  name: string;
  utmSource: string;
  ratio: number;
  status: FallbackNudgeEntryStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    channel: string,
    tags: string[],
    version: number,
    quantity: number,
    name: string,
    utmSource: string,
    ratio: number,
    status: FallbackNudgeEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.channel = channel;
    this.tags = tags;
    this.version = version;
    this.quantity = quantity;
    this.name = name;
    this.utmSource = utmSource;
    this.ratio = ratio;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackNudgeEntryStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackNudgeEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback nudge entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedValue(): number {
    return Math.round(this.version * this.durationMinutes * 100) / 100;
  }

  copy(): FallbackNudgeEntry {
    return new FallbackNudgeEntry(
      this.code,
      this.title,
      this.durationMinutes,
      this.channel,
      this.tags,
      this.version,
      this.quantity,
      this.name,
      this.utmSource,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a fallback nudge entry in status open. */
export function newFallbackNudgeEntry(code: string, title: string): FallbackNudgeEntry {
  return new FallbackNudgeEntry(code, title, 0, "", [], 0, 0, "", "", 0, "open");
}
