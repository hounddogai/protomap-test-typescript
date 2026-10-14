import * as text from "../../../../kit/text.js";

/** Where a model exception is in its life cycle. */
export type ModelExceptionStatus = "created" | "validated" | "published" | "retired";

/** One model exception, with what the planners need to act on it. */
export class ModelException {
  code: string;
  name: string;
  frequencyCap: number;
  sendAt: number;
  endsAt: number;
  impressions: number;
  startsAt: number;
  batchSize: number;
  expiresAt: number;
  capacity: number;
  durationMinutes: number;
  status: ModelExceptionStatus;

  constructor(
    code: string,
    name: string,
    frequencyCap: number,
    sendAt: number,
    endsAt: number,
    impressions: number,
    startsAt: number,
    batchSize: number,
    expiresAt: number,
    capacity: number,
    durationMinutes: number,
    status: ModelExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.sendAt = sendAt;
    this.endsAt = endsAt;
    this.impressions = impressions;
    this.startsAt = startsAt;
    this.batchSize = batchSize;
    this.expiresAt = expiresAt;
    this.capacity = capacity;
    this.durationMinutes = durationMinutes;
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

  canMoveTo(next: ModelExceptionStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ModelExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"model exception"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round(this.frequencyCap * this.batchSize * 100) / 100;
  }

  copy(): ModelException {
    return new ModelException(
      this.code,
      this.name,
      this.frequencyCap,
      this.sendAt,
      this.endsAt,
      this.impressions,
      this.startsAt,
      this.batchSize,
      this.expiresAt,
      this.capacity,
      this.durationMinutes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a model exception in status created. */
export function newModelException(code: string, name: string): ModelException {
  return new ModelException(code, name, 0, 0, 0, 0, 0, 0, 0, 0, 0, "created");
}
