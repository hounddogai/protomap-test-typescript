import * as text from "../../../../kit/text.js";

/** Where a sender entry is in its life cycle. */
export type SenderEntryStatus = "created" | "validated" | "published" | "retired";

/** One sender entry, with what the planners need to act on it. */
export class SenderEntry {
  code: string;
  label: string;
  channel: string;
  tags: string[];
  budget: number;
  ownerId: string;
  timezone: string;
  locale: string;
  version: number;
  conversionRate: number;
  summary: string;
  status: SenderEntryStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    tags: string[],
    budget: number,
    ownerId: string,
    timezone: string,
    locale: string,
    version: number,
    conversionRate: number,
    summary: string,
    status: SenderEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.tags = tags;
    this.budget = budget;
    this.ownerId = ownerId;
    this.timezone = timezone;
    this.locale = locale;
    this.version = version;
    this.conversionRate = conversionRate;
    this.summary = summary;
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

  canMoveTo(next: SenderEntryStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SenderEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"sender entry"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netVolume(): number {
    return Math.round((this.version + this.budget) * 100) / 100;
  }

  copy(): SenderEntry {
    return new SenderEntry(
      this.code,
      this.label,
      this.channel,
      this.tags,
      this.budget,
      this.ownerId,
      this.timezone,
      this.locale,
      this.version,
      this.conversionRate,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a sender entry in status created. */
export function newSenderEntry(code: string, label: string): SenderEntry {
  return new SenderEntry(code, label, "", [], 0, "", "", "", 0, 0, "", "created");
}
