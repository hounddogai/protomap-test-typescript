import * as text from "../../../../kit/text.js";

/** Where a fallback bounce quota is in its life cycle. */
export type FallbackBounceQuotaStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One fallback bounce quota, with what the planners need to act on it. */
export class FallbackBounceQuota {
  code: string;
  title: string;
  graceDays: number;
  ownerId: string;
  floorValue: number;
  margin: number;
  maximum: number;
  revision: number;
  status: FallbackBounceQuotaStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    ownerId: string,
    floorValue: number,
    margin: number,
    maximum: number,
    revision: number,
    status: FallbackBounceQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.ownerId = ownerId;
    this.floorValue = floorValue;
    this.margin = margin;
    this.maximum = maximum;
    this.revision = revision;
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

  canMoveTo(next: FallbackBounceQuotaStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
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
        return next === "archived";
    }
    return false;
  }

  moveTo(next: FallbackBounceQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback bounce quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedExposure(): number {
    return Math.round((this.maximum - this.floorValue) * 100) / 100;
  }

  copy(): FallbackBounceQuota {
    return new FallbackBounceQuota(
      this.code,
      this.title,
      this.graceDays,
      this.ownerId,
      this.floorValue,
      this.margin,
      this.maximum,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a fallback bounce quota in status open. */
export function newFallbackBounceQuota(code: string, title: string): FallbackBounceQuota {
  return new FallbackBounceQuota(code, title, 0, "", 0, 0, 0, 0, "open");
}
