import * as text from "../../../../kit/text.js";

/** Where a window quota is in its life cycle. */
export type WindowQuotaStatus = "created" | "validated" | "published" | "retired";

/** A window quota. Its code is unique within a tenant. */
export class WindowQuota {
  code: string;
  title: string;
  durationMinutes: number;
  discount: number;
  frequencyCap: number;
  pinned: boolean;
  timezone: string;
  sequence: number;
  status: WindowQuotaStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    discount: number,
    frequencyCap: number,
    pinned: boolean,
    timezone: string,
    sequence: number,
    status: WindowQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.discount = discount;
    this.frequencyCap = frequencyCap;
    this.pinned = pinned;
    this.timezone = timezone;
    this.sequence = sequence;
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

  canMoveTo(next: WindowQuotaStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: WindowQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedVolume(): number {
    return Math.round((this.frequencyCap + this.discount) * 100) / 100;
  }

  copy(): WindowQuota {
    return new WindowQuota(
      this.code,
      this.title,
      this.durationMinutes,
      this.discount,
      this.frequencyCap,
      this.pinned,
      this.timezone,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a window quota in status created. */
export function newWindowQuota(code: string, title: string): WindowQuota {
  return new WindowQuota(code, title, 0, 0, 0, false, "", 0, "created");
}
