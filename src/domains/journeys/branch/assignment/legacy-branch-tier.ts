import * as text from "../../../../kit/text.js";

/** Where a legacy branch tier is in its life cycle. */
export type LegacyBranchTierStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A legacy branch tier. Its code is unique within a tenant. */
export class LegacyBranchTier {
  code: string;
  title: string;
  externalRef: string;
  retries: number;
  checksum: string;
  tags: string[];
  status: LegacyBranchTierStatus;

  constructor(
    code: string,
    title: string,
    externalRef: string,
    retries: number,
    checksum: string,
    tags: string[],
    status: LegacyBranchTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.externalRef = externalRef;
    this.retries = retries;
    this.checksum = checksum;
    this.tags = tags;
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

  canMoveTo(next: LegacyBranchTierStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: LegacyBranchTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy branch tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"legacy branch tier"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.retries;
  }

  copy(): LegacyBranchTier {
    return new LegacyBranchTier(
      this.code,
      this.title,
      this.externalRef,
      this.retries,
      this.checksum,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a legacy branch tier in status idle. */
export function newLegacyBranchTier(code: string, title: string): LegacyBranchTier {
  return new LegacyBranchTier(code, title, "", 0, "", [], "idle");
}
