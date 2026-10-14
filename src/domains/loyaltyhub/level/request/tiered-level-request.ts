/**
 * The tiered level request records of loyaltyhub's level work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered level request is in its life cycle. */
export type TieredLevelRequestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A tiered level request as the level team keeps it. */
export class TieredLevelRequest {
  code: string;
  name: string;
  category: string;
  title: string;
  label: string;
  updatedAt: number;
  status: TieredLevelRequestStatus;

  constructor(
    code: string,
    name: string,
    category: string,
    title: string,
    label: string,
    updatedAt: number,
    status: TieredLevelRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.title = title;
    this.label = label;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: TieredLevelRequestStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: TieredLevelRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered level request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.updatedAt;
  }

  copy(): TieredLevelRequest {
    return new TieredLevelRequest(
      this.code,
      this.name,
      this.category,
      this.title,
      this.label,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a tiered level request in status draft. */
export function newTieredLevelRequest(code: string, name: string): TieredLevelRequest {
  return new TieredLevelRequest(code, name, "", "", "", 0, "draft");
}
