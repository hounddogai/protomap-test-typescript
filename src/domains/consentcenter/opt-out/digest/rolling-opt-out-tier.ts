import * as text from "../../../../kit/text.js";

/** Where a rolling opt out tier is in its life cycle. */
export type RollingOptOutTierStatus = "requested" | "granted" | "revoked" | "expired";

/** A rolling opt out tier. Its code is unique within a tenant. */
export class RollingOptOutTier {
  code: string;
  title: string;
  durationMinutes: number;
  approved: boolean;
  archived: boolean;
  status: RollingOptOutTierStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    approved: boolean,
    archived: boolean,
    status: RollingOptOutTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.approved = approved;
    this.archived = archived;
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

  canMoveTo(next: RollingOptOutTierStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
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

  moveTo(next: RollingOptOutTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling opt out tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"rolling opt out tier"} ${this.code}`;
  }

  measuredValue(): number {
    return this.durationMinutes;
  }

  copy(): RollingOptOutTier {
    return new RollingOptOutTier(
      this.code,
      this.title,
      this.durationMinutes,
      this.approved,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a rolling opt out tier in status requested. */
export function newRollingOptOutTier(code: string, title: string): RollingOptOutTier {
  return new RollingOptOutTier(code, title, 0, false, false, "requested");
}
