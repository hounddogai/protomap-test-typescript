import * as text from "../../../../kit/text.js";

/** Where a conversion entry is in its life cycle. */
export type ConversionEntryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One conversion entry, with what the planners need to act on it. */
export class ConversionEntry {
  code: string;
  title: string;
  retries: number;
  channel: string;
  limit: number;
  status: ConversionEntryStatus;

  constructor(
    code: string,
    title: string,
    retries: number,
    channel: string,
    limit: number,
    status: ConversionEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.channel = channel;
    this.limit = limit;
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

  canMoveTo(next: ConversionEntryStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ConversionEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedLoad(): number {
    return Math.round((this.limit + this.retries) * 100) / 100;
  }

  copy(): ConversionEntry {
    return new ConversionEntry(this.code, this.title, this.retries, this.channel, this.limit, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a conversion entry in status open. */
export function newConversionEntry(code: string, title: string): ConversionEntry {
  return new ConversionEntry(code, title, 0, "", 0, "open");
}
