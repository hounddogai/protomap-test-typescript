import * as text from "../../../../kit/text.js";

/** Where a domain threshold is in its life cycle. */
export type DomainThresholdStatus = "new" | "queued" | "running" | "done" | "failed";

/** A domain threshold. Its code is unique within a tenant. */
export class DomainThreshold {
  code: string;
  label: string;
  expiresAt: number;
  capacity: number;
  journeyId: string;
  description: string;
  channel: string;
  pinned: boolean;
  audienceId: string;
  durationMinutes: number;
  title: string;
  status: DomainThresholdStatus;

  constructor(
    code: string,
    label: string,
    expiresAt: number,
    capacity: number,
    journeyId: string,
    description: string,
    channel: string,
    pinned: boolean,
    audienceId: string,
    durationMinutes: number,
    title: string,
    status: DomainThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.expiresAt = expiresAt;
    this.capacity = capacity;
    this.journeyId = journeyId;
    this.description = description;
    this.channel = channel;
    this.pinned = pinned;
    this.audienceId = audienceId;
    this.durationMinutes = durationMinutes;
    this.title = title;
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

  canMoveTo(next: DomainThresholdStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DomainThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netLoad(): number {
    return Math.round((this.capacity + this.expiresAt) * 100) / 100;
  }

  copy(): DomainThreshold {
    return new DomainThreshold(
      this.code,
      this.label,
      this.expiresAt,
      this.capacity,
      this.journeyId,
      this.description,
      this.channel,
      this.pinned,
      this.audienceId,
      this.durationMinutes,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a domain threshold in status new. */
export function newDomainThreshold(code: string, label: string): DomainThreshold {
  return new DomainThreshold(code, label, 0, 0, "", "", "", false, "", 0, "", "new");
}
