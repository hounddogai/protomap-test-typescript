import * as text from "../../../../kit/text.js";

/** Where a csat quota is in its life cycle. */
export type CsatQuotaStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A csat quota. Its code is unique within a tenant. */
export class CsatQuota {
  code: string;
  name: string;
  description: string;
  timezone: string;
  region: string;
  utmSource: string;
  journeyId: string;
  ratio: number;
  revision: number;
  status: CsatQuotaStatus;

  constructor(
    code: string,
    name: string,
    description: string,
    timezone: string,
    region: string,
    utmSource: string,
    journeyId: string,
    ratio: number,
    revision: number,
    status: CsatQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.description = description;
    this.timezone = timezone;
    this.region = region;
    this.utmSource = utmSource;
    this.journeyId = journeyId;
    this.ratio = ratio;
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

  canMoveTo(next: CsatQuotaStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        switch (next) {
          case "reopened":
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

  moveTo(next: CsatQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"csat quota"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round((this.revision - this.ratio) * 100) / 100;
  }

  copy(): CsatQuota {
    return new CsatQuota(
      this.code,
      this.name,
      this.description,
      this.timezone,
      this.region,
      this.utmSource,
      this.journeyId,
      this.ratio,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a csat quota in status open. */
export function newCsatQuota(code: string, name: string): CsatQuota {
  return new CsatQuota(code, name, "", "", "", "", "", 0, 0, "open");
}
