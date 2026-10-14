import * as text from "../../../../kit/text.js";

/** Where a legacy sender entry is in its life cycle. */
export type LegacySenderEntryStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One legacy sender entry, with what the planners need to act on it. */
export class LegacySenderEntry {
  code: string;
  title: string;
  score: number;
  visible: boolean;
  category: string;
  attributes: Map<string, string>;
  channel: string;
  audienceId: string;
  graceDays: number;
  status: LegacySenderEntryStatus;

  constructor(
    code: string,
    title: string,
    score: number,
    visible: boolean,
    category: string,
    attributes: Map<string, string>,
    channel: string,
    audienceId: string,
    graceDays: number,
    status: LegacySenderEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.score = score;
    this.visible = visible;
    this.category = category;
    this.attributes = attributes;
    this.channel = channel;
    this.audienceId = audienceId;
    this.graceDays = graceDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacySenderEntryStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacySenderEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy sender entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"legacy sender entry"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedTotal(): number {
    return Math.round((this.graceDays + this.score) * 100) / 100;
  }

  copy(): LegacySenderEntry {
    return new LegacySenderEntry(
      this.code,
      this.title,
      this.score,
      this.visible,
      this.category,
      this.attributes,
      this.channel,
      this.audienceId,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a legacy sender entry in status proposed. */
export function newLegacySenderEntry(code: string, title: string): LegacySenderEntry {
  return new LegacySenderEntry(code, title, 0, false, "", new Map<string, string>(), "", "", 0, "proposed");
}
