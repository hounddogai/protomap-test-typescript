import * as text from "../../../../kit/text.js";

/** Where a funnel audit is in its life cycle. */
export type FunnelAuditStatus = "created" | "validated" | "published" | "retired";

/** A funnel audit as the funnel team keeps it. */
export class FunnelAudit {
  code: string;
  name: string;
  frequencyCap: number;
  version: number;
  attempts: number;
  audienceId: string;
  weight: number;
  notes: string;
  status: FunnelAuditStatus;

  constructor(
    code: string,
    name: string,
    frequencyCap: number,
    version: number,
    attempts: number,
    audienceId: string,
    weight: number,
    notes: string,
    status: FunnelAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.version = version;
    this.attempts = attempts;
    this.audienceId = audienceId;
    this.weight = weight;
    this.notes = notes;
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

  canMoveTo(next: FunnelAuditStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: FunnelAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedExposure(): number {
    return Math.round(this.frequencyCap * this.version * 100) / 100;
  }

  copy(): FunnelAudit {
    return new FunnelAudit(
      this.code,
      this.name,
      this.frequencyCap,
      this.version,
      this.attempts,
      this.audienceId,
      this.weight,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a funnel audit in status created. */
export function newFunnelAudit(code: string, name: string): FunnelAudit {
  return new FunnelAudit(code, name, 0, 0, 0, "", 0, "", "created");
}
