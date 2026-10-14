import * as text from "../../../../kit/text.js";

/** Where a fraud check bundle is in its life cycle. */
export type FraudCheckBundleStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a fraud check bundle and its current status. */
export class FraudCheckBundle {
  code: string;
  title: string;
  archived: boolean;
  windowDays: number;
  name: string;
  limit: number;
  discount: number;
  status: FraudCheckBundleStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    windowDays: number,
    name: string,
    limit: number,
    discount: number,
    status: FraudCheckBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.windowDays = windowDays;
    this.name = name;
    this.limit = limit;
    this.discount = discount;
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

  canMoveTo(next: FraudCheckBundleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: FraudCheckBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"fraud check bundle"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.windowDays + this.discount) * 100) / 100;
  }

  copy(): FraudCheckBundle {
    return new FraudCheckBundle(
      this.code,
      this.title,
      this.archived,
      this.windowDays,
      this.name,
      this.limit,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a fraud check bundle in status new. */
export function newFraudCheckBundle(code: string, title: string): FraudCheckBundle {
  return new FraudCheckBundle(code, title, false, 0, "", 0, 0, "new");
}
