import * as text from "../../../../kit/text.js";

/** Where a pending reputation checkpoint is in its life cycle. */
export type PendingReputationCheckpointStatus = "requested" | "granted" | "revoked" | "expired";

/** A pending reputation checkpoint as the reputation team keeps it. */
export class PendingReputationCheckpoint {
  code: string;
  name: string;
  externalRef: string;
  timezone: string;
  attempts: number;
  impressions: number;
  cost: number;
  utmSource: string;
  createdAt: number;
  version: number;
  status: PendingReputationCheckpointStatus;

  constructor(
    code: string,
    name: string,
    externalRef: string,
    timezone: string,
    attempts: number,
    impressions: number,
    cost: number,
    utmSource: string,
    createdAt: number,
    version: number,
    status: PendingReputationCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.externalRef = externalRef;
    this.timezone = timezone;
    this.attempts = attempts;
    this.impressions = impressions;
    this.cost = cost;
    this.utmSource = utmSource;
    this.createdAt = createdAt;
    this.version = version;
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

  canMoveTo(next: PendingReputationCheckpointStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        switch (next) {
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

  moveTo(next: PendingReputationCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending reputation checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"pending reputation checkpoint"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round(this.cost * this.attempts * 100) / 100;
  }

  copy(): PendingReputationCheckpoint {
    return new PendingReputationCheckpoint(
      this.code,
      this.name,
      this.externalRef,
      this.timezone,
      this.attempts,
      this.impressions,
      this.cost,
      this.utmSource,
      this.createdAt,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a pending reputation checkpoint in status requested. */
export function newPendingReputationCheckpoint(code: string, name: string): PendingReputationCheckpoint {
  return new PendingReputationCheckpoint(code, name, "", "", 0, 0, 0, "", 0, 0, "requested");
}
