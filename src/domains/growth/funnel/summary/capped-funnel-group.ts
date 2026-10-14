import * as text from "../../../../kit/text.js";

/** Where a capped funnel group is in its life cycle. */
export type CappedFunnelGroupStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a capped funnel group and its current status. */
export class CappedFunnelGroup {
  code: string;
  name: string;
  quantity: number;
  notes: string;
  utmSource: string;
  ceiling: number;
  durationMinutes: number;
  budget: number;
  weight: number;
  ratio: number;
  retries: number;
  status: CappedFunnelGroupStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    notes: string,
    utmSource: string,
    ceiling: number,
    durationMinutes: number,
    budget: number,
    weight: number,
    ratio: number,
    retries: number,
    status: CappedFunnelGroupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.notes = notes;
    this.utmSource = utmSource;
    this.ceiling = ceiling;
    this.durationMinutes = durationMinutes;
    this.budget = budget;
    this.weight = weight;
    this.ratio = ratio;
    this.retries = retries;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedFunnelGroupStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedFunnelGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped funnel group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"capped funnel group"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round((this.ceiling - this.ratio) * 100) / 100;
  }

  copy(): CappedFunnelGroup {
    return new CappedFunnelGroup(
      this.code,
      this.name,
      this.quantity,
      this.notes,
      this.utmSource,
      this.ceiling,
      this.durationMinutes,
      this.budget,
      this.weight,
      this.ratio,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a capped funnel group in status open. */
export function newCappedFunnelGroup(code: string, name: string): CappedFunnelGroup {
  return new CappedFunnelGroup(code, name, 0, "", "", 0, 0, 0, 0, 0, 0, "open");
}
