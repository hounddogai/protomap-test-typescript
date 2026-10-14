import * as text from "../../../../kit/text.js";

/** Where a manual touchpoint segment is in its life cycle. */
export type ManualTouchpointSegmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a manual touchpoint segment and its current status. */
export class ManualTouchpointSegment {
  code: string;
  title: string;
  cost: number;
  channel: string;
  priority: number;
  rate: number;
  category: string;
  contactEmail: string;
  status: ManualTouchpointSegmentStatus;

  constructor(
    code: string,
    title: string,
    cost: number,
    channel: string,
    priority: number,
    rate: number,
    category: string,
    contactEmail: string,
    status: ManualTouchpointSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cost = cost;
    this.channel = channel;
    this.priority = priority;
    this.rate = rate;
    this.category = category;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: ManualTouchpointSegmentStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ManualTouchpointSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual touchpoint segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedValue(): number {
    return Math.round((this.priority + this.cost) * 100) / 100;
  }

  copy(): ManualTouchpointSegment {
    return new ManualTouchpointSegment(
      this.code,
      this.title,
      this.cost,
      this.channel,
      this.priority,
      this.rate,
      this.category,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a manual touchpoint segment in status draft. */
export function newManualTouchpointSegment(code: string, title: string): ManualTouchpointSegment {
  return new ManualTouchpointSegment(code, title, 0, "", 0, 0, "", "", "draft");
}
