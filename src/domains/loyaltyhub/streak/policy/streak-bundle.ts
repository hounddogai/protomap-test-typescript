import * as text from "../../../../kit/text.js";

/** Where a streak bundle is in its life cycle. */
export type StreakBundleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A streak bundle. Its code is unique within a tenant. */
export class StreakBundle {
  code: string;
  title: string;
  rate: number;
  country: string;
  retries: number;
  createdAt: number;
  batchSize: number;
  timezone: string;
  revision: number;
  maximum: number;
  status: StreakBundleStatus;

  constructor(
    code: string,
    title: string,
    rate: number,
    country: string,
    retries: number,
    createdAt: number,
    batchSize: number,
    timezone: string,
    revision: number,
    maximum: number,
    status: StreakBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.rate = rate;
    this.country = country;
    this.retries = retries;
    this.createdAt = createdAt;
    this.batchSize = batchSize;
    this.timezone = timezone;
    this.revision = revision;
    this.maximum = maximum;
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

  canMoveTo(next: StreakBundleStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StreakBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netVolume(): number {
    return Math.round(this.batchSize * this.revision * 100) / 100;
  }

  copy(): StreakBundle {
    return new StreakBundle(
      this.code,
      this.title,
      this.rate,
      this.country,
      this.retries,
      this.createdAt,
      this.batchSize,
      this.timezone,
      this.revision,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a streak bundle in status proposed. */
export function newStreakBundle(code: string, title: string): StreakBundle {
  return new StreakBundle(code, title, 0, "", 0, 0, 0, "", 0, 0, "proposed");
}
