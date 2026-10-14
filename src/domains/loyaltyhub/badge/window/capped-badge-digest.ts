import * as text from "../../../../kit/text.js";

/** Where a capped badge digest is in its life cycle. */
export type CappedBadgeDigestStatus = "new" | "queued" | "running" | "done" | "failed";

/** One capped badge digest, with what the planners need to act on it. */
export class CappedBadgeDigest {
  code: string;
  name: string;
  attempts: number;
  version: number;
  title: string;
  createdAt: number;
  budget: number;
  channel: string;
  notes: string;
  phone: string;
  ownerId: string;
  status: CappedBadgeDigestStatus;

  constructor(
    code: string,
    name: string,
    attempts: number,
    version: number,
    title: string,
    createdAt: number,
    budget: number,
    channel: string,
    notes: string,
    phone: string,
    ownerId: string,
    status: CappedBadgeDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.version = version;
    this.title = title;
    this.createdAt = createdAt;
    this.budget = budget;
    this.channel = channel;
    this.notes = notes;
    this.phone = phone;
    this.ownerId = ownerId;
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

  canMoveTo(next: CappedBadgeDigestStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedBadgeDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped badge digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"capped badge digest"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round(this.budget * this.attempts * 100) / 100;
  }

  copy(): CappedBadgeDigest {
    return new CappedBadgeDigest(
      this.code,
      this.name,
      this.attempts,
      this.version,
      this.title,
      this.createdAt,
      this.budget,
      this.channel,
      this.notes,
      this.phone,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a capped badge digest in status new. */
export function newCappedBadgeDigest(code: string, name: string): CappedBadgeDigest {
  return new CappedBadgeDigest(code, name, 0, 0, "", 0, 0, "", "", "", "", "new");
}
