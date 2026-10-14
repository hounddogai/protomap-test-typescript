/**
 * The primary deflection baseline records of support's deflection work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary deflection baseline is in its life cycle. */
export type PrimaryDeflectionBaselineStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One primary deflection baseline, with what the planners need to act on it. */
export class PrimaryDeflectionBaseline {
  code: string;
  title: string;
  clicks: number;
  limit: number;
  checksum: string;
  ceiling: number;
  status: PrimaryDeflectionBaselineStatus;

  constructor(
    code: string,
    title: string,
    clicks: number,
    limit: number,
    checksum: string,
    ceiling: number,
    status: PrimaryDeflectionBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.clicks = clicks;
    this.limit = limit;
    this.checksum = checksum;
    this.ceiling = ceiling;
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

  canMoveTo(next: PrimaryDeflectionBaselineStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PrimaryDeflectionBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary deflection baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netLoad(): number {
    return Math.round(this.clicks * this.limit * 100) / 100;
  }

  copy(): PrimaryDeflectionBaseline {
    return new PrimaryDeflectionBaseline(
      this.code,
      this.title,
      this.clicks,
      this.limit,
      this.checksum,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a primary deflection baseline in status proposed. */
export function newPrimaryDeflectionBaseline(code: string, title: string): PrimaryDeflectionBaseline {
  return new PrimaryDeflectionBaseline(code, title, 0, 0, "", 0, "proposed");
}
