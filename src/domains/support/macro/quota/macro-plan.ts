import * as text from "../../../../kit/text.js";

/** Where a macro plan is in its life cycle. */
export type MacroPlanStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A macro plan as the macro team keeps it. */
export class MacroPlan {
  code: string;
  title: string;
  summary: string;
  createdAt: number;
  startsAt: number;
  pinned: boolean;
  status: MacroPlanStatus;

  constructor(
    code: string,
    title: string,
    summary: string,
    createdAt: number,
    startsAt: number,
    pinned: boolean,
    status: MacroPlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.summary = summary;
    this.createdAt = createdAt;
    this.startsAt = startsAt;
    this.pinned = pinned;
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

  canMoveTo(next: MacroPlanStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
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
        return next === "closed";
    }
    return false;
  }

  moveTo(next: MacroPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"macro plan"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.startsAt + this.createdAt) * 100) / 100;
  }

  copy(): MacroPlan {
    return new MacroPlan(this.code, this.title, this.summary, this.createdAt, this.startsAt, this.pinned, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a macro plan in status draft. */
export function newMacroPlan(code: string, title: string): MacroPlan {
  return new MacroPlan(code, title, "", 0, 0, false, "draft");
}
