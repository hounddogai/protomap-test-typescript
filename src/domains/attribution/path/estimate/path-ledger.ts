import * as text from "../../../../kit/text.js";

/** Where a path ledger is in its life cycle. */
export type PathLedgerStatus = "requested" | "granted" | "revoked" | "expired";

/** One path ledger, with what the planners need to act on it. */
export class PathLedger {
  code: string;
  title: string;
  sequence: number;
  cohort: string;
  timezone: string;
  ownerId: string;
  sendAt: number;
  description: string;
  version: number;
  status: PathLedgerStatus;

  constructor(
    code: string,
    title: string,
    sequence: number,
    cohort: string,
    timezone: string,
    ownerId: string,
    sendAt: number,
    description: string,
    version: number,
    status: PathLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sequence = sequence;
    this.cohort = cohort;
    this.timezone = timezone;
    this.ownerId = ownerId;
    this.sendAt = sendAt;
    this.description = description;
    this.version = version;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PathLedgerStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PathLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedVolume(): number {
    return Math.round((this.sendAt - this.sequence) * 100) / 100;
  }

  copy(): PathLedger {
    return new PathLedger(
      this.code,
      this.title,
      this.sequence,
      this.cohort,
      this.timezone,
      this.ownerId,
      this.sendAt,
      this.description,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a path ledger in status requested. */
export function newPathLedger(code: string, title: string): PathLedger {
  return new PathLedger(code, title, 0, "", "", "", 0, "", 0, "requested");
}
