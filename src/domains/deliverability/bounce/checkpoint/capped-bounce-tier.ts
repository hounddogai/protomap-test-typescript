import * as text from "../../../../kit/text.js";

/** Where a capped bounce tier is in its life cycle. */
export type CappedBounceTierStatus = "new" | "queued" | "running" | "done" | "failed";

/** A capped bounce tier as the bounce team keeps it. */
export class CappedBounceTier {
  code: string;
  name: string;
  durationMinutes: number;
  audienceId: string;
  version: number;
  notes: string;
  frequencyCap: number;
  threshold: number;
  contactEmail: string;
  limit: number;
  weight: number;
  status: CappedBounceTierStatus;

  constructor(
    code: string,
    name: string,
    durationMinutes: number,
    audienceId: string,
    version: number,
    notes: string,
    frequencyCap: number,
    threshold: number,
    contactEmail: string,
    limit: number,
    weight: number,
    status: CappedBounceTierStatus,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.audienceId = audienceId;
    this.version = version;
    this.notes = notes;
    this.frequencyCap = frequencyCap;
    this.threshold = threshold;
    this.contactEmail = contactEmail;
    this.limit = limit;
    this.weight = weight;
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

  canMoveTo(next: CappedBounceTierStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedBounceTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped bounce tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"capped bounce tier"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.limit + this.version) * 100) / 100;
  }

  copy(): CappedBounceTier {
    return new CappedBounceTier(
      this.code,
      this.name,
      this.durationMinutes,
      this.audienceId,
      this.version,
      this.notes,
      this.frequencyCap,
      this.threshold,
      this.contactEmail,
      this.limit,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a capped bounce tier in status new. */
export function newCappedBounceTier(code: string, name: string): CappedBounceTier {
  return new CappedBounceTier(code, name, 0, "", 0, "", 0, 0, "", 0, 0, "new");
}
