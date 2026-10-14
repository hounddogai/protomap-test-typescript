import * as text from "../../../../kit/text.js";

/** Where a queue entry is in its life cycle. */
export type QueueEntryStatus = "requested" | "granted" | "revoked" | "expired";

/** One queue entry, with what the planners need to act on it. */
export class QueueEntry {
  code: string;
  name: string;
  minimum: number;
  audienceId: string;
  channel: string;
  floorValue: number;
  status: QueueEntryStatus;

  constructor(
    code: string,
    name: string,
    minimum: number,
    audienceId: string,
    channel: string,
    floorValue: number,
    status: QueueEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.audienceId = audienceId;
    this.channel = channel;
    this.floorValue = floorValue;
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

  canMoveTo(next: QueueEntryStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: QueueEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netExposure(): number {
    return Math.round((this.minimum - this.floorValue) * 100) / 100;
  }

  copy(): QueueEntry {
    return new QueueEntry(
      this.code,
      this.name,
      this.minimum,
      this.audienceId,
      this.channel,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a queue entry in status requested. */
export function newQueueEntry(code: string, name: string): QueueEntry {
  return new QueueEntry(code, name, 0, "", "", 0, "requested");
}
