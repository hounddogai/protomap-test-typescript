import * as text from "../../../../kit/text.js";

/** Where a fallback deflection segment is in its life cycle. */
export type FallbackDeflectionSegmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** A fallback deflection segment as the deflection team keeps it. */
export class FallbackDeflectionSegment {
  code: string;
  name: string;
  sendAt: number;
  contactEmail: string;
  phone: string;
  durationMinutes: number;
  budget: number;
  notes: string;
  status: FallbackDeflectionSegmentStatus;

  constructor(
    code: string,
    name: string,
    sendAt: number,
    contactEmail: string,
    phone: string,
    durationMinutes: number,
    budget: number,
    notes: string,
    status: FallbackDeflectionSegmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sendAt = sendAt;
    this.contactEmail = contactEmail;
    this.phone = phone;
    this.durationMinutes = durationMinutes;
    this.budget = budget;
    this.notes = notes;
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

  canMoveTo(next: FallbackDeflectionSegmentStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: FallbackDeflectionSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback deflection segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"fallback deflection segment"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.budget + this.sendAt) * 100) / 100;
  }

  copy(): FallbackDeflectionSegment {
    return new FallbackDeflectionSegment(
      this.code,
      this.name,
      this.sendAt,
      this.contactEmail,
      this.phone,
      this.durationMinutes,
      this.budget,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fallback deflection segment in status new. */
export function newFallbackDeflectionSegment(code: string, name: string): FallbackDeflectionSegment {
  return new FallbackDeflectionSegment(code, name, 0, "", "", 0, 0, "", "new");
}
