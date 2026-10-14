import * as text from "../../../../kit/text.js";

/** Where a global activation cycle is in its life cycle. */
export type GlobalActivationCycleStatus = "created" | "validated" | "published" | "retired";

/** A global activation cycle as the activation team keeps it. */
export class GlobalActivationCycle {
  code: string;
  title: string;
  sequence: number;
  attributes: Map<string, string>;
  endsAt: number;
  ownerId: string;
  startsAt: number;
  reviewer: string;
  journeyId: string;
  bid: number;
  status: GlobalActivationCycleStatus;

  constructor(
    code: string,
    title: string,
    sequence: number,
    attributes: Map<string, string>,
    endsAt: number,
    ownerId: string,
    startsAt: number,
    reviewer: string,
    journeyId: string,
    bid: number,
    status: GlobalActivationCycleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sequence = sequence;
    this.attributes = attributes;
    this.endsAt = endsAt;
    this.ownerId = ownerId;
    this.startsAt = startsAt;
    this.reviewer = reviewer;
    this.journeyId = journeyId;
    this.bid = bid;
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

  canMoveTo(next: GlobalActivationCycleStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalActivationCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global activation cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"global activation cycle"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netTotal(): number {
    return Math.round(this.startsAt * this.bid * 100) / 100;
  }

  copy(): GlobalActivationCycle {
    return new GlobalActivationCycle(
      this.code,
      this.title,
      this.sequence,
      this.attributes,
      this.endsAt,
      this.ownerId,
      this.startsAt,
      this.reviewer,
      this.journeyId,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a global activation cycle in status created. */
export function newGlobalActivationCycle(code: string, title: string): GlobalActivationCycle {
  return new GlobalActivationCycle(code, title, 0, new Map<string, string>(), 0, "", 0, "", "", 0, "created");
}
