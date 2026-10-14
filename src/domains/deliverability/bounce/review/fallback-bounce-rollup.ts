import * as text from "../../../../kit/text.js";

/** Where a fallback bounce rollup is in its life cycle. */
export type FallbackBounceRollupStatus = "requested" | "granted" | "revoked" | "expired";

/** A fallback bounce rollup as the bounce team keeps it. */
export class FallbackBounceRollup {
  code: string;
  name: string;
  startsAt: number;
  revision: number;
  updatedAt: number;
  notes: string;
  status: FallbackBounceRollupStatus;

  constructor(
    code: string,
    name: string,
    startsAt: number,
    revision: number,
    updatedAt: number,
    notes: string,
    status: FallbackBounceRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.revision = revision;
    this.updatedAt = updatedAt;
    this.notes = notes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackBounceRollupStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackBounceRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback bounce rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netLoad(): number {
    return Math.round((this.updatedAt + this.startsAt) * 100) / 100;
  }

  copy(): FallbackBounceRollup {
    return new FallbackBounceRollup(
      this.code,
      this.name,
      this.startsAt,
      this.revision,
      this.updatedAt,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fallback bounce rollup in status requested. */
export function newFallbackBounceRollup(code: string, name: string): FallbackBounceRollup {
  return new FallbackBounceRollup(code, name, 0, 0, 0, "", "requested");
}
