import * as text from "../../../../kit/text.js";

/** Where a global branch digest is in its life cycle. */
export type GlobalBranchDigestStatus = "new" | "queued" | "running" | "done" | "failed";

/** A global branch digest as the branch team keeps it. */
export class GlobalBranchDigest {
  code: string;
  label: string;
  active: boolean;
  amount: number;
  tags: string[];
  budget: number;
  version: number;
  checksum: string;
  timezone: string;
  status: GlobalBranchDigestStatus;

  constructor(
    code: string,
    label: string,
    active: boolean,
    amount: number,
    tags: string[],
    budget: number,
    version: number,
    checksum: string,
    timezone: string,
    status: GlobalBranchDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.amount = amount;
    this.tags = tags;
    this.budget = budget;
    this.version = version;
    this.checksum = checksum;
    this.timezone = timezone;
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

  canMoveTo(next: GlobalBranchDigestStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalBranchDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global branch digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveExposure(): number {
    return Math.round(this.budget * this.amount * 100) / 100;
  }

  copy(): GlobalBranchDigest {
    return new GlobalBranchDigest(
      this.code,
      this.label,
      this.active,
      this.amount,
      this.tags,
      this.budget,
      this.version,
      this.checksum,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a global branch digest in status new. */
export function newGlobalBranchDigest(code: string, label: string): GlobalBranchDigest {
  return new GlobalBranchDigest(code, label, false, 0, [], 0, 0, "", "", "new");
}
