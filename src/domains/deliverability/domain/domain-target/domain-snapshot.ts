import * as text from "../../../../kit/text.js";

/** Where a domain snapshot is in its life cycle. */
export type DomainSnapshotStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A domain snapshot. Its code is unique within a tenant. */
export class DomainSnapshot {
  code: string;
  label: string;
  active: boolean;
  campaignRef: string;
  channel: string;
  tags: string[];
  budget: number;
  status: DomainSnapshotStatus;

  constructor(
    code: string,
    label: string,
    active: boolean,
    campaignRef: string,
    channel: string,
    tags: string[],
    budget: number,
    status: DomainSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.campaignRef = campaignRef;
    this.channel = channel;
    this.tags = tags;
    this.budget = budget;
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

  canMoveTo(next: DomainSnapshotStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "draining" || next === "stopped";
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

  moveTo(next: DomainSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`domain snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
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

  measuredValue(): number {
    return this.budget;
  }

  copy(): DomainSnapshot {
    return new DomainSnapshot(
      this.code,
      this.label,
      this.active,
      this.campaignRef,
      this.channel,
      this.tags,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a domain snapshot in status idle. */
export function newDomainSnapshot(code: string, label: string): DomainSnapshot {
  return new DomainSnapshot(code, label, false, "", "", [], 0, "idle");
}
