import * as text from "../../../../kit/text.js";

/** Where a ticket view window is in its life cycle. */
export type TicketViewWindowStatus = "new" | "queued" | "running" | "done" | "failed";

/** A ticket view window. Its code is unique within a tenant. */
export class TicketViewWindow {
  code: string;
  name: string;
  journeyId: string;
  durationMinutes: number;
  impressions: number;
  endsAt: number;
  archived: boolean;
  locale: string;
  maximum: number;
  description: string;
  version: number;
  status: TicketViewWindowStatus;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    durationMinutes: number,
    impressions: number,
    endsAt: number,
    archived: boolean,
    locale: string,
    maximum: number,
    description: string,
    version: number,
    status: TicketViewWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.durationMinutes = durationMinutes;
    this.impressions = impressions;
    this.endsAt = endsAt;
    this.archived = archived;
    this.locale = locale;
    this.maximum = maximum;
    this.description = description;
    this.version = version;
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

  canMoveTo(next: TicketViewWindowStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "running";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: TicketViewWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"ticket view window"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.durationMinutes - this.endsAt) * 100) / 100;
  }

  copy(): TicketViewWindow {
    return new TicketViewWindow(
      this.code,
      this.name,
      this.journeyId,
      this.durationMinutes,
      this.impressions,
      this.endsAt,
      this.archived,
      this.locale,
      this.maximum,
      this.description,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a ticket view window in status new. */
export function newTicketViewWindow(code: string, name: string): TicketViewWindow {
  return new TicketViewWindow(code, name, "", 0, 0, 0, false, "", 0, "", 0, "new");
}
