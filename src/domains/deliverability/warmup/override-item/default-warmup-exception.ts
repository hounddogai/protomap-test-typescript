import * as text from "../../../../kit/text.js";

/** Where a default warmup exception is in its life cycle. */
export type DefaultWarmupExceptionStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a default warmup exception and its current status. */
export class DefaultWarmupException {
  code: string;
  name: string;
  createdAt: number;
  durationMinutes: number;
  channel: string;
  status: DefaultWarmupExceptionStatus;

  constructor(
    code: string,
    name: string,
    createdAt: number,
    durationMinutes: number,
    channel: string,
    status: DefaultWarmupExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.createdAt = createdAt;
    this.durationMinutes = durationMinutes;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultWarmupExceptionStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "suspended";
      case "pending":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: DefaultWarmupExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default warmup exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"default warmup exception"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.durationMinutes + this.createdAt) * 100) / 100;
  }

  copy(): DefaultWarmupException {
    return new DefaultWarmupException(
      this.code,
      this.name,
      this.createdAt,
      this.durationMinutes,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a default warmup exception in status draft. */
export function newDefaultWarmupException(code: string, name: string): DefaultWarmupException {
  return new DefaultWarmupException(code, name, 0, 0, "", "draft");
}
