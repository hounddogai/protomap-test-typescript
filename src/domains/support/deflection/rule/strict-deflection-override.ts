import * as text from "../../../../kit/text.js";

/** Where a strict deflection override is in its life cycle. */
export type StrictDeflectionOverrideStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a strict deflection override and its current status. */
export class StrictDeflectionOverride {
  code: string;
  title: string;
  channel: string;
  frequencyCap: number;
  capacity: number;
  ratio: number;
  endsAt: number;
  ownerId: string;
  budget: number;
  revision: number;
  status: StrictDeflectionOverrideStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    frequencyCap: number,
    capacity: number,
    ratio: number,
    endsAt: number,
    ownerId: string,
    budget: number,
    revision: number,
    status: StrictDeflectionOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.frequencyCap = frequencyCap;
    this.capacity = capacity;
    this.ratio = ratio;
    this.endsAt = endsAt;
    this.ownerId = ownerId;
    this.budget = budget;
    this.revision = revision;
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

  canMoveTo(next: StrictDeflectionOverrideStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "failed":
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

  moveTo(next: StrictDeflectionOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict deflection override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"strict deflection override"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.endsAt - this.ratio) * 100) / 100;
  }

  copy(): StrictDeflectionOverride {
    return new StrictDeflectionOverride(
      this.code,
      this.title,
      this.channel,
      this.frequencyCap,
      this.capacity,
      this.ratio,
      this.endsAt,
      this.ownerId,
      this.budget,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a strict deflection override in status new. */
export function newStrictDeflectionOverride(code: string, title: string): StrictDeflectionOverride {
  return new StrictDeflectionOverride(code, title, "", 0, 0, 0, 0, "", 0, 0, "new");
}
