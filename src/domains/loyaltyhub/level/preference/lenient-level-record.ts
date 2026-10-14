import * as text from "../../../../kit/text.js";

/** Where a lenient level record is in its life cycle. */
export type LenientLevelRecordStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A lenient level record as the level team keeps it. */
export class LenientLevelRecord {
  code: string;
  name: string;
  amount: number;
  channel: string;
  budget: number;
  tags: string[];
  status: LenientLevelRecordStatus;

  constructor(
    code: string,
    name: string,
    amount: number,
    channel: string,
    budget: number,
    tags: string[],
    status: LenientLevelRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.amount = amount;
    this.channel = channel;
    this.budget = budget;
    this.tags = tags;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: LenientLevelRecordStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientLevelRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient level record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
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

  weightedTotal(): number {
    return Math.round(this.budget * this.amount * 100) / 100;
  }

  copy(): LenientLevelRecord {
    return new LenientLevelRecord(this.code, this.name, this.amount, this.channel, this.budget, this.tags, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a lenient level record in status idle. */
export function newLenientLevelRecord(code: string, name: string): LenientLevelRecord {
  return new LenientLevelRecord(code, name, 0, "", 0, [], "idle");
}
