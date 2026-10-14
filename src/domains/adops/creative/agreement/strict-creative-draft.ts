import * as text from "../../../../kit/text.js";

/** Where a strict creative draft is in its life cycle. */
export type StrictCreativeDraftStatus = "requested" | "granted" | "revoked" | "expired";

/** One strict creative draft, with what the planners need to act on it. */
export class StrictCreativeDraft {
  code: string;
  name: string;
  startsAt: number;
  maximum: number;
  openRate: number;
  status: StrictCreativeDraftStatus;

  constructor(
    code: string,
    name: string,
    startsAt: number,
    maximum: number,
    openRate: number,
    status: StrictCreativeDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.maximum = maximum;
    this.openRate = openRate;
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

  canMoveTo(next: StrictCreativeDraftStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictCreativeDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict creative draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveValue(): number {
    return Math.round((this.openRate + this.maximum) * 100) / 100;
  }

  copy(): StrictCreativeDraft {
    return new StrictCreativeDraft(this.code, this.name, this.startsAt, this.maximum, this.openRate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a strict creative draft in status requested. */
export function newStrictCreativeDraft(code: string, name: string): StrictCreativeDraft {
  return new StrictCreativeDraft(code, name, 0, 0, 0, "requested");
}
