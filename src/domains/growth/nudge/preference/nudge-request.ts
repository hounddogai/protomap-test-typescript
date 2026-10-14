import * as text from "../../../../kit/text.js";

/** Where a nudge request is in its life cycle. */
export type NudgeRequestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a nudge request and its current status. */
export class NudgeRequest {
  code: string;
  name: string;
  frequencyCap: number;
  approved: boolean;
  visible: boolean;
  sequence: number;
  tags: string[];
  sendAt: number;
  currency: string;
  floorValue: number;
  status: NudgeRequestStatus;

  constructor(
    code: string,
    name: string,
    frequencyCap: number,
    approved: boolean,
    visible: boolean,
    sequence: number,
    tags: string[],
    sendAt: number,
    currency: string,
    floorValue: number,
    status: NudgeRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.approved = approved;
    this.visible = visible;
    this.sequence = sequence;
    this.tags = tags;
    this.sendAt = sendAt;
    this.currency = currency;
    this.floorValue = floorValue;
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

  canMoveTo(next: NudgeRequestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "active";
      case "pending":
        switch (next) {
          case "closed":
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

  moveTo(next: NudgeRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"nudge request"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedVolume(): number {
    return Math.round((this.frequencyCap + this.sendAt) * 100) / 100;
  }

  copy(): NudgeRequest {
    return new NudgeRequest(
      this.code,
      this.name,
      this.frequencyCap,
      this.approved,
      this.visible,
      this.sequence,
      this.tags,
      this.sendAt,
      this.currency,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a nudge request in status draft. */
export function newNudgeRequest(code: string, name: string): NudgeRequest {
  return new NudgeRequest(code, name, 0, false, false, 0, [], 0, "", 0, "draft");
}
