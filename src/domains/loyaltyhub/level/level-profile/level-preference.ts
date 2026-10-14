import * as text from "../../../../kit/text.js";

/** Where a level preference is in its life cycle. */
export type LevelPreferenceStatus = "requested" | "granted" | "revoked" | "expired";

/** A level preference. Its code is unique within a tenant. */
export class LevelPreference {
  code: string;
  title: string;
  createdAt: number;
  frequencyCap: number;
  batchSize: number;
  channel: string;
  ratio: number;
  status: LevelPreferenceStatus;

  constructor(
    code: string,
    title: string,
    createdAt: number,
    frequencyCap: number,
    batchSize: number,
    channel: string,
    ratio: number,
    status: LevelPreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.createdAt = createdAt;
    this.frequencyCap = frequencyCap;
    this.batchSize = batchSize;
    this.channel = channel;
    this.ratio = ratio;
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

  canMoveTo(next: LevelPreferenceStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        switch (next) {
          case "revoked":
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

  moveTo(next: LevelPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"level preference"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.createdAt + this.batchSize) * 100) / 100;
  }

  copy(): LevelPreference {
    return new LevelPreference(
      this.code,
      this.title,
      this.createdAt,
      this.frequencyCap,
      this.batchSize,
      this.channel,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a level preference in status requested. */
export function newLevelPreference(code: string, title: string): LevelPreference {
  return new LevelPreference(code, title, 0, 0, 0, "", 0, "requested");
}
