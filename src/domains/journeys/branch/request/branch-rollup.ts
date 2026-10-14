import * as text from "../../../../kit/text.js";

/** Where a branch rollup is in its life cycle. */
export type BranchRollupStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a branch rollup and its current status. */
export class BranchRollup {
  code: string;
  label: string;
  country: string;
  reviewer: string;
  revision: number;
  status: BranchRollupStatus;

  constructor(
    code: string,
    label: string,
    country: string,
    reviewer: string,
    revision: number,
    status: BranchRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.country = country;
    this.reviewer = reviewer;
    this.revision = revision;
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

  canMoveTo(next: BranchRollupStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BranchRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"branch rollup"} ${this.code}`;
  }

  measuredValue(): number {
    return this.revision;
  }

  copy(): BranchRollup {
    return new BranchRollup(this.code, this.label, this.country, this.reviewer, this.revision, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a branch rollup in status requested. */
export function newBranchRollup(code: string, label: string): BranchRollup {
  return new BranchRollup(code, label, "", "", 0, "requested");
}
