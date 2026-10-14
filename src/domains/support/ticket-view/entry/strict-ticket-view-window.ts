import * as text from "../../../../kit/text.js";

/** Where a strict ticket view window is in its life cycle. */
export type StrictTicketViewWindowStatus = "requested" | "granted" | "revoked" | "expired";

/** A strict ticket view window. Its code is unique within a tenant. */
export class StrictTicketViewWindow {
  code: string;
  name: string;
  capacity: number;
  graceDays: number;
  category: string;
  tags: string[];
  status: StrictTicketViewWindowStatus;

  constructor(
    code: string,
    name: string,
    capacity: number,
    graceDays: number,
    category: string,
    tags: string[],
    status: StrictTicketViewWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.graceDays = graceDays;
    this.category = category;
    this.tags = tags;
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

  canMoveTo(next: StrictTicketViewWindowStatus): boolean {
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

  moveTo(next: StrictTicketViewWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict ticket view window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netTotal(): number {
    return Math.round(this.capacity * this.graceDays * 100) / 100;
  }

  copy(): StrictTicketViewWindow {
    return new StrictTicketViewWindow(
      this.code,
      this.name,
      this.capacity,
      this.graceDays,
      this.category,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a strict ticket view window in status requested. */
export function newStrictTicketViewWindow(code: string, name: string): StrictTicketViewWindow {
  return new StrictTicketViewWindow(code, name, 0, 0, "", [], "requested");
}
