import * as text from "../../../../kit/text.js";

/** Where a primary branch rollup is in its life cycle. */
export type PrimaryBranchRollupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One primary branch rollup, with what the planners need to act on it. */
export class PrimaryBranchRollup {
  code: string;
  name: string;
  revision: number;
  graceDays: number;
  startsAt: number;
  archived: boolean;
  status: PrimaryBranchRollupStatus;

  constructor(
    code: string,
    name: string,
    revision: number,
    graceDays: number,
    startsAt: number,
    archived: boolean,
    status: PrimaryBranchRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.graceDays = graceDays;
    this.startsAt = startsAt;
    this.archived = archived;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryBranchRollupStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PrimaryBranchRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary branch rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedLoad(): number {
    return Math.round(this.startsAt * this.revision * 100) / 100;
  }

  copy(): PrimaryBranchRollup {
    return new PrimaryBranchRollup(
      this.code,
      this.name,
      this.revision,
      this.graceDays,
      this.startsAt,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a primary branch rollup in status proposed. */
export function newPrimaryBranchRollup(code: string, name: string): PrimaryBranchRollup {
  return new PrimaryBranchRollup(code, name, 0, 0, 0, false, "proposed");
}
