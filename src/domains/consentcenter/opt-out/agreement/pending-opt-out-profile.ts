import * as text from "../../../../kit/text.js";

/** Where a pending opt out profile is in its life cycle. */
export type PendingOptOutProfileStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A pending opt out profile as the opt out team keeps it. */
export class PendingOptOutProfile {
  code: string;
  name: string;
  attempts: number;
  pinned: boolean;
  frequencyCap: number;
  active: boolean;
  windowDays: number;
  tags: string[];
  utmSource: string;
  status: PendingOptOutProfileStatus;

  constructor(
    code: string,
    name: string,
    attempts: number,
    pinned: boolean,
    frequencyCap: number,
    active: boolean,
    windowDays: number,
    tags: string[],
    utmSource: string,
    status: PendingOptOutProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.pinned = pinned;
    this.frequencyCap = frequencyCap;
    this.active = active;
    this.windowDays = windowDays;
    this.tags = tags;
    this.utmSource = utmSource;
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

  canMoveTo(next: PendingOptOutProfileStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PendingOptOutProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending opt out profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netExposure(): number {
    return Math.round(this.windowDays * this.frequencyCap * 100) / 100;
  }

  copy(): PendingOptOutProfile {
    return new PendingOptOutProfile(
      this.code,
      this.name,
      this.attempts,
      this.pinned,
      this.frequencyCap,
      this.active,
      this.windowDays,
      this.tags,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a pending opt out profile in status draft. */
export function newPendingOptOutProfile(code: string, name: string): PendingOptOutProfile {
  return new PendingOptOutProfile(code, name, 0, false, 0, false, 0, [], "", "draft");
}
