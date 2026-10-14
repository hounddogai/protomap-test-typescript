import * as text from "../../../../kit/text.js";

/** Where a ticket view assignment is in its life cycle. */
export type TicketViewAssignmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** One ticket view assignment, with what the planners need to act on it. */
export class TicketViewAssignment {
  code: string;
  name: string;
  audienceId: string;
  startsAt: number;
  title: string;
  segment: string;
  tags: string[];
  minimum: number;
  notes: string;
  status: TicketViewAssignmentStatus;

  constructor(
    code: string,
    name: string,
    audienceId: string,
    startsAt: number,
    title: string,
    segment: string,
    tags: string[],
    minimum: number,
    notes: string,
    status: TicketViewAssignmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.audienceId = audienceId;
    this.startsAt = startsAt;
    this.title = title;
    this.segment = segment;
    this.tags = tags;
    this.minimum = minimum;
    this.notes = notes;
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

  canMoveTo(next: TicketViewAssignmentStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
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

  moveTo(next: TicketViewAssignmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view assignment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"ticket view assignment"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedExposure(): number {
    return Math.round(this.startsAt * this.minimum * 100) / 100;
  }

  copy(): TicketViewAssignment {
    return new TicketViewAssignment(
      this.code,
      this.name,
      this.audienceId,
      this.startsAt,
      this.title,
      this.segment,
      this.tags,
      this.minimum,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a ticket view assignment in status new. */
export function newTicketViewAssignment(code: string, name: string): TicketViewAssignment {
  return new TicketViewAssignment(code, name, "", 0, "", "", [], 0, "", "new");
}
