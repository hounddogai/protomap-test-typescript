import * as text from "../../../../kit/text.js";

/** Where a manual ticket view tier is in its life cycle. */
export type ManualTicketViewTierStatus = "new" | "queued" | "running" | "done" | "failed";

/** One manual ticket view tier, with what the planners need to act on it. */
export class ManualTicketViewTier {
  code: string;
  name: string;
  cohort: string;
  phone: string;
  tags: string[];
  notes: string;
  endsAt: number;
  summary: string;
  channel: string;
  status: ManualTicketViewTierStatus;

  constructor(
    code: string,
    name: string,
    cohort: string,
    phone: string,
    tags: string[],
    notes: string,
    endsAt: number,
    summary: string,
    channel: string,
    status: ManualTicketViewTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cohort = cohort;
    this.phone = phone;
    this.tags = tags;
    this.notes = notes;
    this.endsAt = endsAt;
    this.summary = summary;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualTicketViewTierStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ManualTicketViewTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual ticket view tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.endsAt;
  }

  copy(): ManualTicketViewTier {
    return new ManualTicketViewTier(
      this.code,
      this.name,
      this.cohort,
      this.phone,
      this.tags,
      this.notes,
      this.endsAt,
      this.summary,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a manual ticket view tier in status new. */
export function newManualTicketViewTier(code: string, name: string): ManualTicketViewTier {
  return new ManualTicketViewTier(code, name, "", "", [], "", 0, "", "", "new");
}
