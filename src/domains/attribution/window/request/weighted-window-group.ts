import * as text from "../../../../kit/text.js";

/** Where a weighted window group is in its life cycle. */
export type WeightedWindowGroupStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One weighted window group, with what the planners need to act on it. */
export class WeightedWindowGroup {
  code: string;
  name: string;
  channel: string;
  description: string;
  capacity: number;
  revision: number;
  contactEmail: string;
  journeyId: string;
  status: WeightedWindowGroupStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    description: string,
    capacity: number,
    revision: number,
    contactEmail: string,
    journeyId: string,
    status: WeightedWindowGroupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.description = description;
    this.capacity = capacity;
    this.revision = revision;
    this.contactEmail = contactEmail;
    this.journeyId = journeyId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedWindowGroupStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: WeightedWindowGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted window group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedValue(): number {
    return Math.round((this.revision + this.capacity) * 100) / 100;
  }

  copy(): WeightedWindowGroup {
    return new WeightedWindowGroup(
      this.code,
      this.name,
      this.channel,
      this.description,
      this.capacity,
      this.revision,
      this.contactEmail,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a weighted window group in status draft. */
export function newWeightedWindowGroup(code: string, name: string): WeightedWindowGroup {
  return new WeightedWindowGroup(code, name, "", "", 0, 0, "", "", "draft");
}
