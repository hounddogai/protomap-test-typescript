import * as text from "../../../../kit/text.js";

/** Where a default challenge slot is in its life cycle. */
export type DefaultChallengeSlotStatus = "created" | "validated" | "published" | "retired";

/** A default challenge slot. Its code is unique within a tenant. */
export class DefaultChallengeSlot {
  code: string;
  label: string;
  pinned: boolean;
  externalRef: string;
  channel: string;
  version: number;
  tags: string[];
  priority: number;
  durationMinutes: number;
  retries: number;
  discount: number;
  status: DefaultChallengeSlotStatus;

  constructor(
    code: string,
    label: string,
    pinned: boolean,
    externalRef: string,
    channel: string,
    version: number,
    tags: string[],
    priority: number,
    durationMinutes: number,
    retries: number,
    discount: number,
    status: DefaultChallengeSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.externalRef = externalRef;
    this.channel = channel;
    this.version = version;
    this.tags = tags;
    this.priority = priority;
    this.durationMinutes = durationMinutes;
    this.retries = retries;
    this.discount = discount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultChallengeSlotStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: DefaultChallengeSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default challenge slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveExposure(): number {
    return Math.round((this.discount - this.retries) * 100) / 100;
  }

  copy(): DefaultChallengeSlot {
    return new DefaultChallengeSlot(
      this.code,
      this.label,
      this.pinned,
      this.externalRef,
      this.channel,
      this.version,
      this.tags,
      this.priority,
      this.durationMinutes,
      this.retries,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a default challenge slot in status created. */
export function newDefaultChallengeSlot(code: string, label: string): DefaultChallengeSlot {
  return new DefaultChallengeSlot(code, label, false, "", "", 0, [], 0, 0, 0, 0, "created");
}
