import * as text from "../../../../kit/text.js";

/** Where a regional double opt in rollup is in its life cycle. */
export type RegionalDoubleOptInRollupStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A regional double opt in rollup. Its code is unique within a tenant. */
export class RegionalDoubleOptInRollup {
  code: string;
  title: string;
  checksum: string;
  active: boolean;
  label: string;
  createdAt: number;
  status: RegionalDoubleOptInRollupStatus;

  constructor(
    code: string,
    title: string,
    checksum: string,
    active: boolean,
    label: string,
    createdAt: number,
    status: RegionalDoubleOptInRollupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.checksum = checksum;
    this.active = active;
    this.label = label;
    this.createdAt = createdAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalDoubleOptInRollupStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalDoubleOptInRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional double opt in rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.createdAt;
  }

  copy(): RegionalDoubleOptInRollup {
    return new RegionalDoubleOptInRollup(
      this.code,
      this.title,
      this.checksum,
      this.active,
      this.label,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a regional double opt in rollup in status draft. */
export function newRegionalDoubleOptInRollup(code: string, title: string): RegionalDoubleOptInRollup {
  return new RegionalDoubleOptInRollup(code, title, "", false, "", 0, "draft");
}
