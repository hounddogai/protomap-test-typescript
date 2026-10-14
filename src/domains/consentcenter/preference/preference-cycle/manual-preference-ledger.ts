import * as text from "../../../../kit/text.js";

/** Where a manual preference ledger is in its life cycle. */
export type ManualPreferenceLedgerStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A manual preference ledger. Its code is unique within a tenant. */
export class ManualPreferenceLedger {
  code: string;
  name: string;
  summary: string;
  revision: number;
  pinned: boolean;
  archived: boolean;
  timezone: string;
  segment: string;
  variant: string;
  status: ManualPreferenceLedgerStatus;

  constructor(
    code: string,
    name: string,
    summary: string,
    revision: number,
    pinned: boolean,
    archived: boolean,
    timezone: string,
    segment: string,
    variant: string,
    status: ManualPreferenceLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.summary = summary;
    this.revision = revision;
    this.pinned = pinned;
    this.archived = archived;
    this.timezone = timezone;
    this.segment = segment;
    this.variant = variant;
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

  canMoveTo(next: ManualPreferenceLedgerStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: ManualPreferenceLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual preference ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.revision;
  }

  copy(): ManualPreferenceLedger {
    return new ManualPreferenceLedger(
      this.code,
      this.name,
      this.summary,
      this.revision,
      this.pinned,
      this.archived,
      this.timezone,
      this.segment,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a manual preference ledger in status idle. */
export function newManualPreferenceLedger(code: string, name: string): ManualPreferenceLedger {
  return new ManualPreferenceLedger(code, name, "", 0, false, false, "", "", "", "idle");
}
