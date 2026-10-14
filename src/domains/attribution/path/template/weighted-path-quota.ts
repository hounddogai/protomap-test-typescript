import * as text from "../../../../kit/text.js";

/** Where a weighted path quota is in its life cycle. */
export type WeightedPathQuotaStatus = "created" | "validated" | "published" | "retired";

/** A weighted path quota as the path team keeps it. */
export class WeightedPathQuota {
  code: string;
  title: string;
  locale: string;
  revision: number;
  category: string;
  region: string;
  sequence: number;
  durationMinutes: number;
  contactEmail: string;
  status: WeightedPathQuotaStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    revision: number,
    category: string,
    region: string,
    sequence: number,
    durationMinutes: number,
    contactEmail: string,
    status: WeightedPathQuotaStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.revision = revision;
    this.category = category;
    this.region = region;
    this.sequence = sequence;
    this.durationMinutes = durationMinutes;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: WeightedPathQuotaStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: WeightedPathQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted path quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"weighted path quota"} ${this.code}`;
  }

  netValue(): number {
    return Math.round(this.durationMinutes * this.revision * 100) / 100;
  }

  copy(): WeightedPathQuota {
    return new WeightedPathQuota(
      this.code,
      this.title,
      this.locale,
      this.revision,
      this.category,
      this.region,
      this.sequence,
      this.durationMinutes,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a weighted path quota in status created. */
export function newWeightedPathQuota(code: string, title: string): WeightedPathQuota {
  return new WeightedPathQuota(code, title, "", 0, "", "", 0, 0, "", "created");
}
