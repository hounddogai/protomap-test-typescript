import * as text from "../../../../kit/text.js";

/** Where a journey slot is in its life cycle. */
export type JourneySlotStatus = "new" | "queued" | "running" | "done" | "failed";

/** A journey slot as the journey team keeps it. */
export class JourneySlot {
  code: string;
  name: string;
  ratio: number;
  checksum: string;
  externalRef: string;
  status: JourneySlotStatus;

  constructor(
    code: string,
    name: string,
    ratio: number,
    checksum: string,
    externalRef: string,
    status: JourneySlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.checksum = checksum;
    this.externalRef = externalRef;
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

  canMoveTo(next: JourneySlotStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: JourneySlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"journey slot"} ${this.code}`;
  }

  measuredValue(): number {
    return this.ratio;
  }

  copy(): JourneySlot {
    return new JourneySlot(this.code, this.name, this.ratio, this.checksum, this.externalRef, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a journey slot in status new. */
export function newJourneySlot(code: string, name: string): JourneySlot {
  return new JourneySlot(code, name, 0, "", "", "new");
}
