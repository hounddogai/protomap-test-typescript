import * as text from "../../../../kit/text.js";

/** Where a sender cycle is in its life cycle. */
export type SenderCycleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a sender cycle and its current status. */
export class SenderCycle {
  code: string;
  name: string;
  reviewer: string;
  openRate: number;
  archived: boolean;
  visible: boolean;
  description: string;
  unit: string;
  channel: string;
  tags: string[];
  status: SenderCycleStatus;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    openRate: number,
    archived: boolean,
    visible: boolean,
    description: string,
    unit: string,
    channel: string,
    tags: string[],
    status: SenderCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.openRate = openRate;
    this.archived = archived;
    this.visible = visible;
    this.description = description;
    this.unit = unit;
    this.channel = channel;
    this.tags = tags;
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

  canMoveTo(next: SenderCycleStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SenderCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.openRate;
  }

  copy(): SenderCycle {
    return new SenderCycle(
      this.code,
      this.name,
      this.reviewer,
      this.openRate,
      this.archived,
      this.visible,
      this.description,
      this.unit,
      this.channel,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a sender cycle in status draft. */
export function newSenderCycle(code: string, name: string): SenderCycle {
  return new SenderCycle(code, name, "", 0, false, false, "", "", "", [], "draft");
}
