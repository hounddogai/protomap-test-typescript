import * as text from "../../../../kit/text.js";

/** Where a capped ticket view checkpoint is in its life cycle. */
export type CappedTicketViewCheckpointStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a capped ticket view checkpoint and its current status. */
export class CappedTicketViewCheckpoint {
  code: string;
  title: string;
  pinned: boolean;
  version: number;
  name: string;
  expiresAt: number;
  updatedAt: number;
  status: CappedTicketViewCheckpointStatus;

  constructor(
    code: string,
    title: string,
    pinned: boolean,
    version: number,
    name: string,
    expiresAt: number,
    updatedAt: number,
    status: CappedTicketViewCheckpointStatus,
  ) {
    this.code = code;
    this.title = title;
    this.pinned = pinned;
    this.version = version;
    this.name = name;
    this.expiresAt = expiresAt;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: CappedTicketViewCheckpointStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: CappedTicketViewCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped ticket view checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netTotal(): number {
    return Math.round(this.expiresAt * this.version * 100) / 100;
  }

  copy(): CappedTicketViewCheckpoint {
    return new CappedTicketViewCheckpoint(
      this.code,
      this.title,
      this.pinned,
      this.version,
      this.name,
      this.expiresAt,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a capped ticket view checkpoint in status idle. */
export function newCappedTicketViewCheckpoint(code: string, title: string): CappedTicketViewCheckpoint {
  return new CappedTicketViewCheckpoint(code, title, false, 0, "", 0, 0, "idle");
}
