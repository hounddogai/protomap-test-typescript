import * as text from "../../../../kit/text.js";

/** Where a touchpoint notice is in its life cycle. */
export type TouchpointNoticeStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A touchpoint notice. Its code is unique within a tenant. */
export class TouchpointNotice {
  code: string;
  name: string;
  createdAt: number;
  category: string;
  reviewer: string;
  budget: number;
  journeyId: string;
  revision: number;
  sequence: number;
  minimum: number;
  summary: string;
  status: TouchpointNoticeStatus;

  constructor(
    code: string,
    name: string,
    createdAt: number,
    category: string,
    reviewer: string,
    budget: number,
    journeyId: string,
    revision: number,
    sequence: number,
    minimum: number,
    summary: string,
    status: TouchpointNoticeStatus,
  ) {
    this.code = code;
    this.name = name;
    this.createdAt = createdAt;
    this.category = category;
    this.reviewer = reviewer;
    this.budget = budget;
    this.journeyId = journeyId;
    this.revision = revision;
    this.sequence = sequence;
    this.minimum = minimum;
    this.summary = summary;
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

  canMoveTo(next: TouchpointNoticeStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: TouchpointNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveTotal(): number {
    return Math.round(this.minimum * this.revision * 100) / 100;
  }

  copy(): TouchpointNotice {
    return new TouchpointNotice(
      this.code,
      this.name,
      this.createdAt,
      this.category,
      this.reviewer,
      this.budget,
      this.journeyId,
      this.revision,
      this.sequence,
      this.minimum,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a touchpoint notice in status idle. */
export function newTouchpointNotice(code: string, name: string): TouchpointNotice {
  return new TouchpointNotice(code, name, 0, "", "", 0, "", 0, 0, 0, "", "idle");
}
