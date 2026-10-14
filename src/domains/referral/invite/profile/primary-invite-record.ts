import * as text from "../../../../kit/text.js";

/** Where a primary invite record is in its life cycle. */
export type PrimaryInviteRecordStatus = "created" | "validated" | "published" | "retired";

/** One primary invite record, with what the planners need to act on it. */
export class PrimaryInviteRecord {
  code: string;
  name: string;
  summary: string;
  durationMinutes: number;
  locale: string;
  campaignRef: string;
  contactEmail: string;
  notes: string;
  checksum: string;
  startsAt: number;
  status: PrimaryInviteRecordStatus;

  constructor(
    code: string,
    name: string,
    summary: string,
    durationMinutes: number,
    locale: string,
    campaignRef: string,
    contactEmail: string,
    notes: string,
    checksum: string,
    startsAt: number,
    status: PrimaryInviteRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.summary = summary;
    this.durationMinutes = durationMinutes;
    this.locale = locale;
    this.campaignRef = campaignRef;
    this.contactEmail = contactEmail;
    this.notes = notes;
    this.checksum = checksum;
    this.startsAt = startsAt;
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

  canMoveTo(next: PrimaryInviteRecordStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PrimaryInviteRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary invite record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveExposure(): number {
    return Math.round((this.startsAt - this.durationMinutes) * 100) / 100;
  }

  copy(): PrimaryInviteRecord {
    return new PrimaryInviteRecord(
      this.code,
      this.name,
      this.summary,
      this.durationMinutes,
      this.locale,
      this.campaignRef,
      this.contactEmail,
      this.notes,
      this.checksum,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a primary invite record in status created. */
export function newPrimaryInviteRecord(code: string, name: string): PrimaryInviteRecord {
  return new PrimaryInviteRecord(code, name, "", 0, "", "", "", "", "", 0, "created");
}
