import * as text from "../../../../kit/text.js";

/** Where a sender quota is in its life cycle. */
export type SenderQuotaStatus = "created" | "validated" | "published" | "retired";

/** One sender quota, with what the planners need to act on it. */
export class SenderQuota {
  code: string;
  label: string;
  startsAt: number;
  summary: string;
  cohort: string;
  checksum: string;
  name: string;
  status: SenderQuotaStatus;

  constructor(
    code: string,
    label: string,
    startsAt: number,
    summary: string,
    cohort: string,
    checksum: string,
    name: string,
    status: SenderQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.startsAt = startsAt;
    this.summary = summary;
    this.cohort = cohort;
    this.checksum = checksum;
    this.name = name;
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

  canMoveTo(next: SenderQuotaStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: SenderQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"sender quota"} ${this.code}`;
  }

  measuredValue(): number {
    return this.startsAt;
  }

  copy(): SenderQuota {
    return new SenderQuota(
      this.code,
      this.label,
      this.startsAt,
      this.summary,
      this.cohort,
      this.checksum,
      this.name,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a sender quota in status created. */
export function newSenderQuota(code: string, label: string): SenderQuota {
  return new SenderQuota(code, label, 0, "", "", "", "", "created");
}
