import * as text from "../../../../kit/text.js";

/** Where a tiered creative manifest is in its life cycle. */
export type TieredCreativeManifestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One tiered creative manifest, with what the planners need to act on it. */
export class TieredCreativeManifest {
  code: string;
  title: string;
  maximum: number;
  startsAt: number;
  durationMinutes: number;
  windowDays: number;
  retries: number;
  contactEmail: string;
  discount: number;
  segment: string;
  status: TieredCreativeManifestStatus;

  constructor(
    code: string,
    title: string,
    maximum: number,
    startsAt: number,
    durationMinutes: number,
    windowDays: number,
    retries: number,
    contactEmail: string,
    discount: number,
    segment: string,
    status: TieredCreativeManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.startsAt = startsAt;
    this.durationMinutes = durationMinutes;
    this.windowDays = windowDays;
    this.retries = retries;
    this.contactEmail = contactEmail;
    this.discount = discount;
    this.segment = segment;
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

  canMoveTo(next: TieredCreativeManifestStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: TieredCreativeManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered creative manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedExposure(): number {
    return Math.round(this.retries * this.maximum * 100) / 100;
  }

  copy(): TieredCreativeManifest {
    return new TieredCreativeManifest(
      this.code,
      this.title,
      this.maximum,
      this.startsAt,
      this.durationMinutes,
      this.windowDays,
      this.retries,
      this.contactEmail,
      this.discount,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a tiered creative manifest in status open. */
export function newTieredCreativeManifest(code: string, title: string): TieredCreativeManifest {
  return new TieredCreativeManifest(code, title, 0, 0, 0, 0, 0, "", 0, "", "open");
}
