import * as text from "../../../../kit/text.js";

/** Where a capped domain entry is in its life cycle. */
export type CappedDomainEntryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a capped domain entry and its current status. */
export class CappedDomainEntry {
  code: string;
  name: string;
  channel: string;
  description: string;
  source: string;
  tags: string[];
  conversionRate: number;
  status: CappedDomainEntryStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    description: string,
    source: string,
    tags: string[],
    conversionRate: number,
    status: CappedDomainEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.description = description;
    this.source = source;
    this.tags = tags;
    this.conversionRate = conversionRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedDomainEntryStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "cancelled";
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedDomainEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped domain entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"capped domain entry"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.conversionRate;
  }

  copy(): CappedDomainEntry {
    return new CappedDomainEntry(
      this.code,
      this.name,
      this.channel,
      this.description,
      this.source,
      this.tags,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a capped domain entry in status planned. */
export function newCappedDomainEntry(code: string, name: string): CappedDomainEntry {
  return new CappedDomainEntry(code, name, "", "", "", [], 0, "planned");
}
