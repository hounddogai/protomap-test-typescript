import * as text from "../../../../kit/text.js";

/** Where a csat bundle is in its life cycle. */
export type CsatBundleStatus = "new" | "queued" | "running" | "done" | "failed";

/** One csat bundle, with what the planners need to act on it. */
export class CsatBundle {
  code: string;
  title: string;
  active: boolean;
  approved: boolean;
  name: string;
  archived: boolean;
  ceiling: number;
  quantity: number;
  channel: string;
  cohort: string;
  unit: string;
  status: CsatBundleStatus;

  constructor(
    code: string,
    title: string,
    active: boolean,
    approved: boolean,
    name: string,
    archived: boolean,
    ceiling: number,
    quantity: number,
    channel: string,
    cohort: string,
    unit: string,
    status: CsatBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.active = active;
    this.approved = approved;
    this.name = name;
    this.archived = archived;
    this.ceiling = ceiling;
    this.quantity = quantity;
    this.channel = channel;
    this.cohort = cohort;
    this.unit = unit;
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

  canMoveTo(next: CsatBundleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        return next === "running";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CsatBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedLoad(): number {
    return Math.round((this.ceiling - this.quantity) * 100) / 100;
  }

  copy(): CsatBundle {
    return new CsatBundle(
      this.code,
      this.title,
      this.active,
      this.approved,
      this.name,
      this.archived,
      this.ceiling,
      this.quantity,
      this.channel,
      this.cohort,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a csat bundle in status new. */
export function newCsatBundle(code: string, title: string): CsatBundle {
  return new CsatBundle(code, title, false, false, "", false, 0, 0, "", "", "", "new");
}
