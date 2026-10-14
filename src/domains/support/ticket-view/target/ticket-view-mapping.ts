import * as text from "../../../../kit/text.js";

/** Where a ticket view mapping is in its life cycle. */
export type TicketViewMappingStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A ticket view mapping. Its code is unique within a tenant. */
export class TicketViewMapping {
  code: string;
  title: string;
  tags: string[];
  maximum: number;
  campaignRef: string;
  discount: number;
  status: TicketViewMappingStatus;

  constructor(
    code: string,
    title: string,
    tags: string[],
    maximum: number,
    campaignRef: string,
    discount: number,
    status: TicketViewMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.tags = tags;
    this.maximum = maximum;
    this.campaignRef = campaignRef;
    this.discount = discount;
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

  canMoveTo(next: TicketViewMappingStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended" || next === "closed";
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: TicketViewMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"ticket view mapping"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedValue(): number {
    return Math.round(this.discount * this.maximum * 100) / 100;
  }

  copy(): TicketViewMapping {
    return new TicketViewMapping(
      this.code,
      this.title,
      this.tags,
      this.maximum,
      this.campaignRef,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a ticket view mapping in status draft. */
export function newTicketViewMapping(code: string, title: string): TicketViewMapping {
  return new TicketViewMapping(code, title, [], 0, "", 0, "draft");
}
