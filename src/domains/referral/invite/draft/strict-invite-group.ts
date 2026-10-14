import * as text from "../../../../kit/text.js";

/** Where a strict invite group is in its life cycle. */
export type StrictInviteGroupStatus = "new" | "queued" | "running" | "done" | "failed";

/** One strict invite group, with what the planners need to act on it. */
export class StrictInviteGroup {
  code: string;
  name: string;
  sequence: number;
  quantity: number;
  retries: number;
  weight: number;
  status: StrictInviteGroupStatus;

  constructor(
    code: string,
    name: string,
    sequence: number,
    quantity: number,
    retries: number,
    weight: number,
    status: StrictInviteGroupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sequence = sequence;
    this.quantity = quantity;
    this.retries = retries;
    this.weight = weight;
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

  canMoveTo(next: StrictInviteGroupStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "running";
      case "queued":
        return next === "running";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictInviteGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict invite group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"strict invite group"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.retries - this.weight) * 100) / 100;
  }

  copy(): StrictInviteGroup {
    return new StrictInviteGroup(
      this.code,
      this.name,
      this.sequence,
      this.quantity,
      this.retries,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a strict invite group in status new. */
export function newStrictInviteGroup(code: string, name: string): StrictInviteGroup {
  return new StrictInviteGroup(code, name, 0, 0, 0, 0, "new");
}
