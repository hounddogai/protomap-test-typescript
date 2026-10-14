import * as text from "../../../../kit/text.js";

/** Where a pending subscription manifest is in its life cycle. */
export type PendingSubscriptionManifestStatus = "created" | "validated" | "published" | "retired";

/** The record of a pending subscription manifest and its current status. */
export class PendingSubscriptionManifest {
  code: string;
  title: string;
  windowDays: number;
  locale: string;
  limit: number;
  approved: boolean;
  weight: number;
  budget: number;
  status: PendingSubscriptionManifestStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    locale: string,
    limit: number,
    approved: boolean,
    weight: number,
    budget: number,
    status: PendingSubscriptionManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.locale = locale;
    this.limit = limit;
    this.approved = approved;
    this.weight = weight;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingSubscriptionManifestStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PendingSubscriptionManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending subscription manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"pending subscription manifest"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.budget - this.windowDays) * 100) / 100;
  }

  copy(): PendingSubscriptionManifest {
    return new PendingSubscriptionManifest(
      this.code,
      this.title,
      this.windowDays,
      this.locale,
      this.limit,
      this.approved,
      this.weight,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a pending subscription manifest in status created. */
export function newPendingSubscriptionManifest(code: string, title: string): PendingSubscriptionManifest {
  return new PendingSubscriptionManifest(code, title, 0, "", 0, false, 0, 0, "created");
}
