import * as text from "../../../../kit/text.js";

/** Where a strict ticket view slot is in its life cycle. */
export type StrictTicketViewSlotStatus = "requested" | "granted" | "revoked" | "expired";

/** A strict ticket view slot as the ticket view team keeps it. */
export class StrictTicketViewSlot {
  code: string;
  name: string;
  externalRef: string;
  clicks: number;
  frequencyCap: number;
  tags: string[];
  revision: number;
  status: StrictTicketViewSlotStatus;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    clicks: number,
    frequencyCap: number,
    tags: string[],
    revision: number,
    status: StrictTicketViewSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.clicks = clicks;
    this.frequencyCap = frequencyCap;
    this.tags = tags;
    this.revision = revision;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictTicketViewSlotStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictTicketViewSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict ticket view slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netValue(): number {
    return Math.round((this.frequencyCap - this.revision) * 100) / 100;
  }

  copy(): StrictTicketViewSlot {
    return new StrictTicketViewSlot(
      this.code,
      this.name,
      this.externalRef,
      this.clicks,
      this.frequencyCap,
      this.tags,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a strict ticket view slot in status requested. */
export function newStrictTicketViewSlot(code: string, name: string): StrictTicketViewSlot {
  return new StrictTicketViewSlot(code, name, "", 0, 0, [], 0, "requested");
}
